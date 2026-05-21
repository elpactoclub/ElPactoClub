import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post, Message } from './post.entity';
import { User } from '../users/user.entity';
import { BadgesService } from '../badges/badges.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post) private postRepo: Repository<Post>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly badges: BadgesService,
    private readonly notifications: NotificationsService,
    private readonly users: UsersService,
  ) {}

  async getPosts() {
    const posts = await this.postRepo.find({
      where: { isVisible: true },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const users = authorIds.length ? await this.userRepo.findBy({ id: In(authorIds) }) : [];
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    return posts.map((p) => ({
      ...p,
      authorName: userMap[p.authorId]?.name ?? 'Fan',
      authorAvatar: userMap[p.authorId]?.avatar ?? '🏀',
      authorRole: userMap[p.authorId]?.role ?? 'fan',
    }));
  }

  async createPost(authorId: string, body: { type: string; content: string; pollOptions?: string[] }) {
    const post = this.postRepo.create({
      authorId,
      type: body.type as any,
      content: body.content,
      pollOptions: body.pollOptions,
      pollVotes: body.pollOptions
        ? Object.fromEntries(body.pollOptions.map((o) => [o, 0]))
        : undefined,
    });
    const saved = await this.postRepo.save(post);

    // Notify all fans when a creator publishes
    const author = await this.userRepo.findOne({ where: { id: authorId } });
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

  async likePost(postId: string) {
    await this.postRepo.increment({ id: postId }, 'likesCount', 1);
    return { ok: true };
  }

  async votePoll(postId: string, option: string) {
    const post = await this.postRepo.findOneBy({ id: postId });
    if (!post?.pollVotes) return { ok: false };
    const votes = { ...post.pollVotes, [option]: (post.pollVotes[option] || 0) + 1 };
    await this.postRepo.update(postId, { pollVotes: votes });
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
      userName: userMap[m.userId]?.name ?? 'Fan',
      userAvatar: userMap[m.userId]?.avatar ?? '🏀',
      userRole: userMap[m.userId]?.role ?? 'fan',
    }));
  }

  async createMessage(userId: string, channel: string, content: string) {
    const msg = this.messageRepo.create({ userId, channel, content });
    const saved = await this.messageRepo.save(msg);

    // Badge: socializador on 10th message
    const count = await this.messageRepo.count({ where: { userId } });
    if (count === 10) {
      await this.badges.award(userId, 'socializador');
    }

    return saved;
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