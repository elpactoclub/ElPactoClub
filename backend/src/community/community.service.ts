import { Injectable, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { Post, Message, PostComment } from './post.entity';
import { Story } from './story.entity';
import { User } from '../users/user.entity';
import { BadgesService } from '../badges/badges.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(PostComment) private commentRepo: Repository<PostComment>,
    @InjectRepository(Story) private storyRepo: Repository<Story>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly badges: BadgesService,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
    @Optional() private readonly gateway?: AppGateway,
  ) {}

  async getPosts(userId?: string) {
    const posts = await this.postRepo.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const users = authorIds.length ? await this.userRepo.findBy({ id: In(authorIds) }) : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    // Feed = creators/admins (always) + people I follow + my own posts, minus blocked.
    const followingIds = userId ? new Set(await this.users.getFollowingIds(userId)) : new Set<string>();
    const blockedIds = userId ? new Set(await this.users.getMutualBlockIds(userId)) : new Set<string>();

    const visible = posts.filter((p) => {
      if (blockedIds.has(p.authorId)) return false;
      const role = userMap[p.authorId]?.role ?? 'fan';
      if (role === 'creator' || role === 'admin') return true;
      if (!userId) return false; // anon only sees creators/admins
      if (p.authorId === userId) return true;
      return followingIds.has(p.authorId);
    }).slice(0, 30);

    return this.enrichPosts(visible, userId);
  }

  /** Adds author info, comment counts, like/reaction state to a list of posts. */
  private async enrichPosts(posts: Post[], userId?: string) {
    if (posts.length === 0) return [];
    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const users = await this.userRepo.findBy({ id: In(authorIds) });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const ids = posts.map((p) => p.id);
    const commentCounts = new Map<string, number>();
    const rows = await this.commentRepo
      .createQueryBuilder('c')
      .select('c.postId', 'postId')
      .addSelect('COUNT(*)', 'count')
      .where('c.postId IN (:...ids)', { ids })
      .groupBy('c.postId')
      .getRawMany();
    for (const r of rows) commentCounts.set(r.postId, Number(r.count));

    return posts.map((p) => ({
      ...p,
      authorName: userMap[p.authorId]?.name ?? 'Fan',
      authorAvatar: userMap[p.authorId]?.avatar ?? '🏀',
      authorRole: userMap[p.authorId]?.role ?? 'fan',
      liked: !!(userId && (p.likedBy ?? []).includes(userId)),
      commentsCount: commentCounts.get(p.id) ?? 0,
      reactions: Object.fromEntries(Object.entries(p.reactions ?? {}).map(([e, ids]) => [e, (ids ?? []).length])),
      myReactions: userId ? Object.keys(p.reactions ?? {}).filter((e) => (p.reactions![e] ?? []).includes(userId)) : [],
      myVote: userId && p.pollVoters ? (p.pollVoters[userId] ?? null) : null,
      pollVoters: undefined,
    }));
  }

  /** Posts authored by a specific user (their profile). */
  async getPostsByUser(authorId: string, viewerId?: string) {
    const posts = await this.postRepo.find({
      where: { authorId, isVisible: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return this.enrichPosts(posts, viewerId);
  }

  /** Posts a specific user has liked. */
  async getLikedPostsByUser(userId: string, viewerId?: string) {
    const posts = await this.postRepo
      .createQueryBuilder('p')
      .where('p.isVisible = true')
      .andWhere('p.likedBy @> :uid', { uid: JSON.stringify([userId]) })
      .orderBy('p.createdAt', 'DESC')
      .take(50)
      .getMany();
    return this.enrichPosts(posts, viewerId);
  }

  /** A single post by id (enriched). Used for shared links and profile views. */
  async getPostById(id: string, viewerId?: string) {
    const post = await this.postRepo.findOne({ where: { id, isVisible: true } });
    if (!post) return null;
    const [enriched] = await this.enrichPosts([post], viewerId);
    return enriched ?? null;
  }

  /** Lista de comentarios de un post con datos de autor y si el usuario les dio like. */
  async getComments(postId: string, userId?: string) {
    const comments = await this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'ASC' },
      take: 200,
    });
    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = userIds.length ? await this.userRepo.findBy({ id: In(userIds) }) : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    return comments.map((c) => ({
      id: c.id,
      content: c.content,
      userId: c.userId,
      authorName: userMap[c.userId]?.name ?? 'Fan',
      authorAvatar: userMap[c.userId]?.avatar ?? '🏀',
      authorRole: userMap[c.userId]?.role ?? 'fan',
      likesCount: c.likesCount ?? 0,
      liked: !!(userId && (c.likedBy ?? []).includes(userId)),
      createdAt: c.createdAt,
    }));
  }

  /** Crea un comentario. +1 XP al autor del comentario. Notifica al autor del post. */
  async addComment(postId: string, userId: string, rawContent: string) {
    const content = (rawContent ?? '').trim();
    if (!content) throw new ForbiddenException('Comentario vacío');
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post) throw new NotFoundException('Post no encontrado');

    const saved = await this.commentRepo.save(this.commentRepo.create({ postId, userId, content }));

    const author = await this.userRepo.findOne({ where: { id: userId } });

    return {
      id: saved.id,
      content: saved.content,
      userId,
      authorName: author?.name ?? 'Fan',
      authorAvatar: author?.avatar ?? '🏀',
      authorRole: author?.role ?? 'fan',
      likesCount: 0,
      liked: false,
      createdAt: saved.createdAt,
    };
  }

  async likeComment(commentId: string, userId: string) {
    const comment = await this.commentRepo.findOneBy({ id: commentId });
    if (!comment) return { ok: false };
    const likedBy = comment.likedBy || [];
    const wasLiked = likedBy.includes(userId);
    const newLikedBy = wasLiked ? likedBy.filter((id) => id !== userId) : [...likedBy, userId];
    const newCount = Math.max(0, (comment.likesCount ?? 0) + (wasLiked ? -1 : 1));
    await this.commentRepo.update(commentId, { likedBy: newLikedBy, likesCount: newCount });
    return { liked: !wasLiked, likesCount: newCount };
  }

  async deleteComment(commentId: string, userId: string, role: string) {
    const comment = await this.commentRepo.findOneBy({ id: commentId });
    if (!comment) throw new NotFoundException('Comentario no encontrado');
    if (comment.userId !== userId && role !== 'admin') {
      throw new ForbiddenException('No tienes permiso para eliminar este comentario');
    }
    await this.commentRepo.remove(comment);
    return { ok: true };
  }

  async createStory(userId: string, imageUrl: string, caption?: string) {
    const story = this.storyRepo.create({ userId, imageUrl, caption: caption ?? undefined });
    return this.storyRepo.save(story);
  }

  /** Borra de la base las historias con más de 24h. Corre cada hora. */
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredStories() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.storyRepo.delete({ createdAt: LessThan(cutoff) });
    if (result.affected) console.log(`🧹 ${result.affected} historias expiradas eliminadas`);
  }

  async deleteStory(storyId: string, userId: string, role: string) {
    const story = await this.storyRepo.findOne({ where: { id: storyId } });
    if (!story) throw new Error('Story not found');
    if (story.userId !== userId && role !== 'admin') throw new Error('No autorizado');
    await this.storyRepo.delete(storyId);
    return { ok: true };
  }

  /** Story bar: own story first, then creators/admins (always), then followed users. */
  async getStoryAuthors(userId?: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeStories = await this.storyRepo.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: 'DESC' },
    });

    // Keep only the most recent story per user
    const latestStory = new Map<string, Story>();
    for (const s of activeStories) {
      if (!latestStory.has(s.userId)) latestStory.set(s.userId, s);
    }

    const creators = await this.userRepo.find({
      where: [{ role: 'creator' }, { role: 'admin' }],
      select: ['id', 'name', 'avatar', 'role'],
    });

    let followed: User[] = [];
    let blockedIds = new Set<string>();
    if (userId) {
      blockedIds = new Set(await this.users.getMutualBlockIds(userId));
      const followingIds = await this.users.getFollowingIds(userId);
      if (followingIds.length) {
        followed = await this.userRepo.find({
          where: { id: In(followingIds) },
          select: ['id', 'name', 'avatar', 'role'],
        });
      }
    }

    const result: object[] = [];

    // 1. Own story first
    if (userId) {
      const myStory = latestStory.get(userId);
      if (myStory) {
        const me = await this.userRepo.findOne({
          where: { id: userId },
          select: ['id', 'name', 'avatar', 'role'],
        });
        if (me) {
          result.push({
            id: me.id,
            name: me.name,
            avatar: me.avatar,
            role: me.role,
            storyId: myStory.id,
            storyImageUrl: myStory.imageUrl ?? null,
            caption: myStory.caption ?? null,
            isOwn: true,
          });
        }
      }
    }

    // 2. Creators/admins (always), then followed users
    const byId = new Map<string, User>();
    for (const c of creators) byId.set(c.id, c);
    for (const f of followed) if (!byId.has(f.id)) byId.set(f.id, f);

    for (const u of byId.values()) {
      if (u.id === userId || blockedIds.has(u.id)) continue;
      const story = latestStory.get(u.id);
      if (!story) continue;
      result.push({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        storyImageUrl: story.imageUrl ?? null,
        caption: story.caption ?? null,
      });
    }

    return result;
  }

  async createPost(authorId: string, body: { type: string; content: string; pollOptions?: string[]; imageUrl?: string }) {
    const post = this.postRepo.create({
      authorId,
      type: body.type as any,
      content: body.content,
      imageUrl: body.imageUrl,
      pollOptions: body.pollOptions,
      pollVotes: body.pollOptions
        ? Object.fromEntries(body.pollOptions.map((o) => [o, 0]))
        : undefined,
    });
    const saved = await this.postRepo.save(post);

    const author = await this.userRepo.findOne({ where: { id: authorId } });

    // Real-time: broadcast to all feed subscribers
    this.gateway?.emitNewPost({
      ...saved,
      authorName: author?.name ?? 'Fan',
      authorAvatar: author?.avatar ?? '🏀',
      authorRole: author?.role ?? 'fan',
      liked: false,
      myVote: null,
      pollVoters: undefined,
    });

    // Notify all fans when a creator publishes
    if (author && (author.role === 'creator' || author.role === 'admin')) {
      const preview = body.content.length > 80 ? body.content.slice(0, 80) + '…' : body.content;
      await this.notifications.notifyAll(
        'post_creator',
        `${author.name} ha publicado`,
        preview,
        { postId: saved.id, authorId },
      );
    }

    return saved;
  }

  async deletePost(postId: string, userId: string, userRole: string) {
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post) throw new NotFoundException('Post no encontrado');
    if (post.authorId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('No tienes permiso para eliminar este post');
    }
    await this.postRepo.remove(post);
    return { ok: true };
  }

  async likePost(postId: string, userId: string) {
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post) return { ok: false };
    const likedBy = post.likedBy || [];
    const wasLiked = likedBy.includes(userId);
    const newLikedBy = wasLiked
      ? likedBy.filter((id) => id !== userId)
      : [...likedBy, userId];
    const newCount = Math.max(0, (post.likesCount ?? 0) + (wasLiked ? -1 : 1));
    await this.postRepo.update(postId, { likedBy: newLikedBy, likesCount: newCount });
    return { liked: !wasLiked, likesCount: newCount };
  }

  /** Toggle a quick emoji reaction on a post. Returns counts + the user's reactions. */
  async reactPost(postId: string, userId: string, emoji: string) {
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post) return { ok: false };
    const reactions: Record<string, string[]> = post.reactions ?? {};
    const current = reactions[emoji] ?? [];
    const had = current.includes(userId);
    reactions[emoji] = had ? current.filter((id) => id !== userId) : [...current, userId];
    if (reactions[emoji].length === 0) delete reactions[emoji];
    await this.postRepo.update(postId, { reactions });
    const counts = Object.fromEntries(Object.entries(reactions).map(([e, ids]) => [e, ids.length]));
    const mine = Object.keys(reactions).filter((e) => reactions[e].includes(userId));
    return { counts, mine };
  }

  async closePoll(postId: string, userId: string, role: string) {
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post) throw new NotFoundException('Post no encontrado');
    if (post.authorId !== userId && role !== 'admin') {
      throw new ForbiddenException('No tienes permiso');
    }
    await this.postRepo.update(postId, { pollClosed: true });
    return { ok: true };
  }

  async votePoll(postId: string, option: string, userId?: string) {
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post?.pollVotes) return { ok: false };
    const voters = post.pollVoters ?? {};
    if (userId && voters[userId]) {
      return { ok: false, alreadyVoted: true, myVote: voters[userId], votes: post.pollVotes };
    }
    const votes = { ...post.pollVotes, [option]: (post.pollVotes[option] || 0) + 1 };
    const newVoters = userId ? { ...voters, [userId]: option } : voters;
    await this.postRepo.update(postId, { pollVotes: votes, pollVoters: newVoters });
    return { ok: true, votes };
  }

  async getMessages(channel: string) {
    const messages = await this.messageRepo.find({
      where: { channel },
      order: { createdAt: 'ASC' },
      take: 50,
    });
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = userIds.length ? await this.userRepo.findBy({ id: In(userIds) }) : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
    return messages.map((m) => ({
      ...m,
      authorName: userMap[m.userId]?.name ?? 'Fan',
      authorAvatar: userMap[m.userId]?.avatar ?? '🏀',
      authorRole: userMap[m.userId]?.role ?? 'fan',
    }));
  }

  async createMessage(userId: string, channel: string, content: string) {
    const msg = this.messageRepo.create({ userId, channel, content });
    const saved = await this.messageRepo.save(msg);

    // +1 XP per chat message
    await this.users.addXP(userId, 1);

    // Weekly activity bit 4 = chatted
    await this.users.updateWeekActivity(userId, 4);

    // Badge: socializador on 10th message
    const count = await this.messageRepo.count({ where: { userId } });
    if (count === 10) {
      await this.badges.award(userId, 'socializador');
    }

    // Real-time: broadcast to channel subscribers
    const user = await this.userRepo.findOne({ where: { id: userId } });
    this.gateway?.emitNewMessage(channel, {
      id: saved.id,
      userId: saved.userId,
      content: saved.content,
      createdAt: saved.createdAt,
      authorName: user?.name ?? 'Fan',
      authorAvatar: user?.avatar ?? '🏀',
      authorRole: user?.role ?? 'fan',
    });

    return saved;
  }

  async deleteMessage(messageId: string, userId: string, role: string) {
    const msg = await this.messageRepo.findOneBy({ id: messageId });
    if (!msg) throw new NotFoundException('Mensaje no encontrado');
    // El autor puede borrar el suyo; admin y creator pueden borrar cualquiera (moderación)
    if (msg.userId !== userId && role !== 'admin' && role !== 'creator') {
      throw new ForbiddenException('No tienes permiso para eliminar este mensaje');
    }
    const { channel } = msg;
    await this.messageRepo.remove(msg);
    this.gateway?.emitDeletedMessage(channel, messageId);
    return { ok: true };
  }

  async dmToCreator(userId: string, creatorName: string, content: string) {
    // 50 créditos / +30 XP / canal privado dm-creator-<creator>
    await this.users.spendCredits(userId, 50);
    await this.users.addXP(userId, 30);
    const channel = `dm-creator-${creatorName.toLowerCase().replace(/\s+/g, '-')}`;
    const saved = await this.messageRepo.save({ userId, channel, content });

    // Badge: fan_directo on first creator DM
    const previous = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.userId = :userId', { userId })
      .andWhere("m.channel LIKE 'dm-creator-%'")
      .getCount();
    if (previous === 1) {
      await this.badges.award(userId, 'fan_directo');
    }

    return saved;
  }
}