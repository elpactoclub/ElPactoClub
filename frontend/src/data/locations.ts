// Divisiones administrativas de primer nivel por país (cubren todo el territorio).
// Argentina → provincias, España → provincias, México/Brasil → estados,
// Colombia/Perú/Uruguay/Paraguay → departamentos, Chile → regiones.
// La última opción ("Otra"/"Outra") permite a quien no encuentre su zona.

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  España: [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
    "Islas Baleares", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
    "Castellón", "Ciudad Real", "Córdoba", "La Coruña", "Cuenca", "Gerona",
    "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Jaén", "León",
    "Lérida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense",
    "Palencia", "Las Palmas", "Pontevedra", "La Rioja", "Salamanca",
    "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona",
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora",
    "Zaragoza", "Ceuta", "Melilla", "Otra",
  ],
  Argentina: [
    "Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco",
    "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy",
    "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
    "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe",
    "Santiago del Estero", "Tierra del Fuego", "Tucumán", "Otra",
  ],
  México: [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
    "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
    "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
    "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
    "Otra",
  ],
  Colombia: [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar",
    "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
    "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
    "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
    "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
    "Valle del Cauca", "Vaupés", "Vichada", "Otra",
  ],
  Perú: [
    "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca",
    "Callao", "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad",
    "Lambayeque", "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco",
    "Piura", "Puno", "San Martín", "Tacna", "Tumbes", "Ucayali", "Otra",
  ],
  Chile: [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana de Santiago",
    "Libertador General Bernardo O'Higgins", "Maule", "Ñuble", "Biobío",
    "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes", "Otra",
  ],
  Brasil: [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahía", "Ceará", "Distrito Federal",
    "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul",
    "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
    "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia",
    "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins", "Outra",
  ],
  Uruguay: [
    "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores",
    "Florida", "Lavalleja", "Maldonado", "Montevideo", "Paysandú", "Río Negro",
    "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó",
    "Treinta y Tres", "Otra",
  ],
  Paraguay: [
    "Asunción", "Alto Paraguay", "Alto Paraná", "Amambay", "Boquerón",
    "Caaguazú", "Caazapá", "Canindeyú", "Central", "Concepción", "Cordillera",
    "Guairá", "Itapúa", "Misiones", "Ñeembucú", "Paraguarí", "Presidente Hayes",
    "San Pedro", "Otra",
  ],
  Otro: ["Otra"],
};

export const COUNTRIES = Object.keys(CITIES_BY_COUNTRY);
