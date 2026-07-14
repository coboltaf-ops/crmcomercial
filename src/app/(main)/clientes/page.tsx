'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ModuleHeader from '@/shared/components/module-header'
import EnviarCorreoModal from '@/shared/components/enviar-correo-modal'
import { useClientesStore, Cliente, generarCodigoAcceso } from '@/features/clientes/store/clientes-store'
import { useContactosStore } from '@/features/contactos/store/contactos-store'
import { useCotizacionesStore } from '@/features/cotizaciones/store/cotizaciones-store'
import { useOportunidadesStore } from '@/features/oportunidades/store/oportunidades-store'
import { usePQRSStore } from '@/features/pqrs/store/pqrs-store'
import { fmtMoney } from '@/shared/lib/format-number'
import { useReferenceStore } from '@/features/referencias/store/reference-store'
import { useCurrentUserStore } from '@/features/usuarios-gestion/store/current-user-store'
import { usePermisos } from '@/shared/hooks/use-permisos'
import { fDate, todayColombia } from '@/shared/lib/format-date'
import { nextConsecutivo } from '@/shared/lib/consecutivo'
import ReportPanel from '@/shared/components/report-panel'
import SeguimientoPanel from '@/shared/components/seguimiento-panel'
import DocumentosPanel from '@/shared/components/documentos-panel'
import { useAsistenteStore } from '@/shared/stores/asistente-store'
import { useT, useIdioma, useTStatus } from '@/shared/i18n/use-t'

// ── Ubicación multi-país (Colombia, Perú, Ecuador) embebida — evita imports que fallan en Vercel/Turbopack ──
type UbicPais = { l1: string; l2: string; l3: string; tree: Record<string, Record<string, string[]>> }
const UBIC: Record<string, UbicPais> = {"Colombia":{"l1":"Región","l2":"Departamento","l3":"Ciudad","tree":{"Amazonía":{"Amazonas":["Leticia","Puerto Nariño"],"Caquetá":["Albania","Belén de los Andaquíes","Cartagena del Chairá","Curillo","El Doncello","El Paujil","Florencia","La Montañita","Milán","Morelia","Puerto Rico","San José del Fragua","San Vicente del Caguán","Solano","Solita","Valparaíso"],"Guainía":["Inírida"],"Guaviare":["Calamar","El Retorno","Miraflores","San José del Guaviare"],"Putumayo":["Colón","Mocoa","Orito","Puerto Asís","Puerto Caicedo","Puerto Guzmán","Puerto Leguízamo","San Francisco","San Miguel","Santiago","Sibundoy","Valle del Guamuez","Villagarzón"],"Vaupés":["Carurú","Mitú","Taraira"]},"Andina":{"Antioquia":["Abejorral","Abriaquí","Alejandría","Amagá","Amalfi","Andes","Angelópolis","Angostura","Anorí","Anzá","Apartadó","Arboletes","Argelia","Armenia","Barbosa","Bello","Belmira","Betania","Betulia","Briceño","Buriticá","Cáceres","Caicedo","Caldas","Campamento","Cañasgordas","Caracolí","Caramanta","Carepa","Carolina del Príncipe","Caucasia","Chigorodó","Cisneros","Ciudad Bolívar","Cocorná","Concepción","Concordia","Copacabana","Dabeiba","Donmatías","Ebéjico","El Bagre","El Carmen de Viboral","El Peñol","El Retiro","El Santuario","Entrerríos","Envigado","Fredonia","Frontino","Giraldo","Girardota","Gómez Plata","Granada","Guadalupe","Guarne","Guatapé","Heliconia","Hispania","Itagüí","Ituango","Jardín","Jericó","La Ceja","La Estrella","La Pintada","La Unión","Liborina","Maceo","Marinilla","Medellín","Montebello","Murindó","Mutatá","Nariño","Nechí","Necoclí","Olaya","Peque","Pueblorrico","Puerto Berrío","Puerto Nare","Puerto Triunfo","Remedios","Rionegro","Sabanalarga","Sabaneta","Salgar","San Andrés de Cuerquia","San Carlos","San Francisco","San Jerónimo","San José de la Montaña","San Juan de Urabá","San Luis","San Pedro de los Milagros","San Pedro de Urabá","San Rafael","San Roque","San Vicente","Santa Bárbara","Santa Fe de Antioquia","Santa Rosa de Osos","Santo Domingo","Segovia","Sonsón","Sopetrán","Támesis","Tarazá","Tarso","Titiribí","Toledo","Turbo","Uramita","Urrao","Valdivia","Valparaíso","Vegachí","Venecia","Vigía del Fuerte","Yalí","Yarumal","Yolombó","Yondó","Zaragoza"],"Boyacá":["Almeida","Aquitania","Arcabuco","Belén","Berbeo","Betéitiva","Boavita","Boyacá","Briceño","Buenavista","Busbanzá","Caldas","Campohermoso","Cerinza","Chinavita","Chiquinquirá","Chíquiza","Chiscas","Chita","Chitaraque","Chivatá","Chivor","Ciénega","Cómbita","Coper","Corrales","Covarachía","Cubará","Cucaita","Cuítiva","Duitama","El Cocuy","El Espino","Firavitoba","Floresta","Gachantivá","Gámeza","Garagoa","Guacamayas","Guateque","Guayatá","Güicán","Iza","Jenesano","Jericó","La Capilla","La Uvita","La Victoria","Labranzagrande","Macanal","Maripí","Miraflores","Mongua","Monguí","Moniquirá","Motavita","Muzo","Nobsa","Nuevo Colón","Oicatá","Otanche","Pachavita","Páez","Paipa","Pajarito","Panqueba","Pauna","Paya","Paz del Río","Pesca","Pisba","Puerto Boyacá","Quípama","Ramiriquí","Ráquira","Rondón","Saboyá","Sáchica","Samacá","San Eduardo","San José de Pare","San Luis de Gaceno","San Mateo","San Miguel de Sema","San Pablo de Borbur","Santa María","Santa Rosa de Viterbo","Santa Sofía","Santana","Sativanorte","Sativasur","Siachoque","Soatá","Socha","Socotá","Sogamoso","Somondoco","Sora","Soracá","Sotaquirá","Susacón","Sutamarchán","Sutatenza","Tasco","Tenza","Tibaná","Tibasosa","Tinjacá","Tipacoque","Toca","Togüí","Tópaga","Tota","Tunja","Tununguá","Turmequé","Tuta","Tutazá","Úmbita","Ventaquemada","Villa de Leyva","Viracachá","Zetaquira"],"Caldas":["Aguadas","Anserma","Aranzazu","Belalcázar","Chinchiná","Filadelfia","La Dorada","La Merced","Manizales","Manzanares","Marmato","Marquetalia","Marulanda","Neira","Norcasia","Pácora","Palestina","Pensilvania","Riosucio","Risaralda","Salamina","Samaná","San José","Supía","Victoria","Villamaría","Viterbo"],"Cundinamarca":["Agua de Dios","Albán","Anapoima","Anolaima","Apulo","Arbeláez","Beltrán","Bituima","Bogotá","Bojacá","Cabrera","Cachipay","Cajicá","Caparrapí","Cáqueza","Carmen de Carupa","Chaguaní","Chía","Chipaque","Choachí","Chocontá","Cogua","Cota","Cucunubá","El Colegio","El Peñón","El Rosal","Facatativá","Fómeque","Fosca","Funza","Fúquene","Fusagasugá","Gachalá","Gachancipá","Gachetá","Gama","Girardot","Granada","Guachetá","Guaduas","Guasca","Guataquí","Guatavita","Guayabal de Síquima","Guayabetal","Gutiérrez","Jerusalén","Junín","La Calera","La Mesa","La Palma","La Peña","La Vega","Lenguazaque","Machetá","Madrid","Manta","Medina","Mosquera","Nariño","Nemocón","Nilo","Nimaima","Nocaima","Pacho","Paime","Pandi","Paratebueno","Pasca","Puerto Salgar","Pulí","Quebradanegra","Quetame","Quipile","Ricaurte","San Antonio del Tequendama","San Bernardo","San Cayetano","San Francisco","San Juan de Rioseco","Sasaima","Sesquilé","Sibaté","Silvania","Simijaca","Soacha","Sopó","Subachoque","Suesca","Supatá","Susa","Sutatausa","Tabio","Tausa","Tena","Tenjo","Tibacuy","Tibirita","Tocaima","Tocancipá","Topaipí","Ubalá","Ubaque","Ubaté","Une","Útica","Venecia","Vergara","Vianí","Villagómez","Villapinzón","Villeta","Viotá","Yacopí","Zipacón","Zipaquirá"],"Huila":["Acevedo","Agrado","Aipe","Algeciras","Altamira","Baraya","Campoalegre","Colombia","El Pital","Elías","Garzón","Gigante","Guadalupe","Hobo","Íquira","Isnos","La Argentina","La Plata","Nátaga","Neiva","Oporapa","Paicol","Palermo","Palestina","Pitalito","Rivera","Saladoblanco","San Agustín","Santa María","Suaza","Tarqui","Tello","Teruel","Tesalia","Timaná","Villavieja","Yaguará"],"Norte de Santander":["Ábrego","Arboledas","Bochalema","Bucarasica","Cáchira","Cácota","Chinácota","Chitagá","Convención","Cúcuta","Cucutilla","Duranía","El Carmen","El Tarra","El Zulia","Gramalote","Hacarí","Herrán","La Esperanza","La Playa de Belén","Labateca","Los Patios","Lourdes","Mutiscua","Ocaña","Pamplona","Pamplonita","Puerto Santander","Ragonvalia","Salazar de Las Palmas","San Calixto","San Cayetano","Santiago","Santo Domingo de Silos","Sardinata","Teorama","Tibú","Toledo","Villa Caro","Villa del Rosario"],"Quindío":["Armenia","Buenavista","Calarcá","Circasia","Córdoba","Filandia","Génova","La Tebaida","Montenegro","Pijao","Quimbaya","Salento"],"Risaralda":["Apía","Balboa","Belén de Umbría","Dosquebradas","Guática","La Celia","La Virginia","Marsella","Mistrató","Pereira","Pueblo Rico","Quinchía","Santa Rosa de Cabal","Santuario"],"Santander":["Aguada","Albania","Aratoca","Barbosa","Barichara","Barrancabermeja","Betulia","Bolívar","Bucaramanga","Cabrera","California","Capitanejo","Carcasí","Cepitá","Cerrito","Charalá","Charta","Chima","Chipatá","Cimitarra","Concepción","Confines","Contratación","Coromoro","Curití","El Carmen de Chucurí","El Guacamayo","El Peñón","El Playón","El Socorro","Encino","Enciso","Florián","Floridablanca","Galán","Gámbita","Girón","Guaca","Guadalupe","Guapotá","Guavatá","Güepsa","Hato","Jesús María","Jordán","La Belleza","La Paz","Landázuri","Lebrija","Los Santos","Macaravita","Málaga","Matanza","Mogotes","Molagavita","Ocamonte","Oiba","Onzaga","Palmar","Palmas del Socorro","Páramo","Piedecuesta","Pinchote","Puente Nacional","Puerto Parra","Puerto Wilches","Rionegro","Sabana de Torres","San Andrés","San Benito","San Gil","San Joaquín","San José de Miranda","San Miguel","San Vicente de Chucurí","Santa Bárbara","Santa Helena del Opón","Simacota","Suaita","Sucre","Suratá","Tona","Valle de San José","Vélez","Vetas","Villanueva","Zapatoca"],"Tolima":["Alpujarra","Alvarado","Ambalema","Anzoátegui","Armero","Ataco","Cajamarca","Carmen de Apicalá","Casabianca","Chaparral","Coello","Coyaima","Cunday","Dolores","El Espinal","Falán","Flandes","Fresno","Guamo","Herveo","Honda","Ibagué","Icononzo","Lérida","Líbano","Mariquita","Melgar","Murillo","Natagaima","Ortega","Palocabildo","Piedras","Planadas","Prado","Purificación","Rioblanco","Roncesvalles","Rovira","Saldaña","San Antonio","San Luis","Santa Isabel","Suárez","Valle de San Juan","Venadillo","Villahermosa","Villarrica"]},"Caribe":{"Atlántico":["Baranoa","Barranquilla","Campo de la Cruz","Candelaria","Galapa","Juan de Acosta","Luruaco","Malambo","Manatí","Palmar de Varela","Piojó","Polonuevo","Ponedera","Puerto Colombia","Repelón","Sabanagrande","Sabanalarga","Santa Lucía","Santo Tomás","Soledad","Suán","Tubará","Usiacurí"],"Bolívar":["Achí","Altos del Rosario","Arenal","Arjona","Arroyohondo","Barranco de Loba","Brazuelo de Papayal","Calamar","Cantagallo","Cartagena de Indias","Cicuco","Clemencia","Córdoba","El Carmen de Bolívar","El Guamo","El Peñón","Hatillo de Loba","Magangué","Mahates","Margarita","María la Baja","Mompós","Montecristo","Morales","Norosí","Pinillos","Regidor","Río Viejo","San Cristóbal","San Estanislao","San Fernando","San Jacinto","San Jacinto del Cauca","San Juan Nepomuceno","San Martín de Loba","San Pablo","Santa Catalina","Santa Rosa","Santa Rosa del Sur","Simití","Soplaviento","Talaigua Nuevo","Tiquisio","Turbaco","Turbaná","Villanueva","Zambrano"],"Cesar":["Aguachica","Agustín Codazzi","Astrea","Becerril","Bosconia","Chimichagua","Chiriguaná","Curumaní","El Copey","El Paso","Gamarra","González","La Gloria (Cesar)","La Jagua de Ibirico","La Paz","Manaure Balcón del Cesar","Pailitas","Pelaya","Pueblo Bello","Río de Oro","San Alberto","San Diego","San Martín","Tamalameque","Valledupar"],"Córdoba":["Ayapel","Buenavista","Canalete","Cereté","Chimá","Chinú","Ciénaga de Oro","Cotorra","La Apartada","Lorica","Los Córdobas","Momil","Montelíbano","Montería","Moñitos","Planeta Rica","Pueblo Nuevo","Puerto Escondido","Puerto Libertador","Purísima","Sahagún","San Andrés de Sotavento","San Antero","San Bernardo del Viento","San Carlos","San José de Uré","San Pelayo","Tierralta","Tuchín","Valencia"],"La Guajira":["Albania","Barrancas","Dibulla","Distracción","El Molino","Fonseca","Hatonuevo","La Jagua del Pilar","Maicao","Manaure","Riohacha","San Juan del Cesar","Uribia","Urumita","Villanueva"],"Magdalena":["Algarrobo","Aracataca","Ariguaní","Cerro de San Antonio","Chibolo","Chibolo","Ciénaga","Concordia","El Banco","El Piñón","El Retén","Fundación","Guamal","Nueva Granada","Pedraza","Pijiño del Carmen","Pivijay","Plato","Pueblo Viejo","Remolino","Sabanas de San Ángel","Salamina","San Sebastián de Buenavista","San Zenón","Santa Ana","Santa Bárbara de Pinto","Santa Marta","Sitionuevo","Tenerife","Zapayán","Zona Bananera"],"Sucre":["Buenavista","Caimito","Chalán","Colosó","Corozal","Coveñas","El Roble","Galeras","Guaranda","La Unión","Los Palmitos","Majagual","Morroa","Ovejas","Sampués","San Antonio de Palmito","San Benito Abad","San Juan de Betulia","San Marcos","San Onofre","San Pedro","Sincé","Sincelejo","Sucre","Tolú","Tolú Viejo"]},"Insular":{"San Andrés y Providencia":["Providencia y Santa Catalina Islas","San Andrés"]},"Orinoquía":{"Arauca":["Arauca","Arauquita","Cravo Norte","Fortul","Puerto Rondón","Saravena","Tame"],"Casanare":["Aguazul","Chámeza","Hato Corozal","La Salina","Maní","Monterrey","Nunchía","Orocué","Paz de Ariporo","Pore","Recetor","Sabanalarga","Sácama","San Luis de Palenque","Támara","Tauramena","Trinidad","Villanueva","Yopal"],"Meta":["Acacías","Barranca de Upía","Cabuyaro","Castilla la Nueva","Cubarral","Cumaral","El Calvario","El Castillo","El Dorado","Fuente de Oro","Granada","Guamal","La Macarena","La Uribe","Lejanías","Mapiripán","Mesetas","Puerto Concordia","Puerto Gaitán","Puerto Lleras","Puerto López","Puerto Rico","Restrepo","San Carlos de Guaroa","San Juan de Arama","San Juanito","San Martín","Villavicencio","Vista Hermosa"],"Vichada":["Cumaribo","La Primavera","Puerto Carreño","Santa Rosalía"]},"Pacífica":{"Cauca":["Almaguer","Argelia","Balboa","Bolívar","Buenos Aires","Cajibío","Caldono","Caloto","Corinto","El Tambo","Florencia","Guachené","Guapí","Inzá","Jambaló","La Sierra","La Vega","López de Micay","Mercaderes","Miranda","Morales","Padilla","Páez","Patía","Piamonte","Piendamó","Popayán","Puerto Tejada","Puracé","Rosas","San Sebastián","Santa Rosa","Santander de Quilichao","Silvia","Sotará","Suárez","Sucre","Timbío","Timbiquí","Toribío","Totoró","Villa Rica"],"Chocó":["Acandí","Alto Baudó","Bagadó","Bahía Solano","Bajo Baudó","Bojayá","Cantón de San Pablo","Cértegui","Condoto","El Atrato","El Carmen de Atrato","El Carmen del Darién","Istmina","Juradó","Litoral de San Juan","Lloró","Medio Atrato","Medio Baudó","Medio San Juan","Nóvita","Nuquí","Quibdó","Río Iró","Río Quito","Riosucio","San José del Palmar","Sipí","Tadó","Unguía","Unión Panamericana"],"Nariño":["Aldana","Ancuyá","Arboleda","Barbacoas","Belén","Buesaco","Chachagüí","Colón","Consacá","Contadero","Córdoba","Cuaspud","Cumbal","Cumbitara","El Charco","El Peñol","El Rosario","El Tablón","El Tambo","Francisco Pizarro","Funes","Guachucal","Guaitarilla","Gualmatán","Iles","Imués","Ipiales","La Cruz","La Florida","La Llanada","La Tola","La Unión","Leiva","Linares","Los Andes","Magüí Payán","Mallama","Mosquera","Nariño","Olaya Herrera","Ospina","Pasto","Policarpa","Potosí","Providencia","Puerres","Pupiales","Ricaurte","Roberto Payán","Samaniego","San Bernardo","San José de Albán","San Lorenzo","San Pablo","San Pedro de Cartago","Sandoná","Santa Bárbara","Santacruz","Sapuyes","Taminango","Tangua","Tumaco","Túquerres","Yacuanquer"],"Valle del Cauca":["Alcalá","Andalucía","Ansermanuevo","Argelia","Bolívar","Buenaventura","Buga","Bugalagrande","Caicedonia","Cali","Calima","Candelaria","Cartago","Dagua","El Águila","El Cairo","El Cerrito","El Dovio","Florida","Ginebra","Guacarí","Jamundí","La Cumbre","La Unión","La Victoria","Obando","Palmira","Pradera","Restrepo","Riofrío","Roldanillo","San Pedro","Sevilla","Toro","Trujillo","Tuluá","Ulloa","Versalles","Vijes","Yotoco","Yumbo","Zarzal"]}}},"Perú":{"l1":"Departamento","l2":"Provincia","l3":"Distrito","tree":{"Amazonas":{"Bagua":["Aramango","Copallin","El Parco","Imaza","La Peca"],"Bongara":["Chisquilla","Churuja","Corosha","Cuispes","Florida","Jazan","Jumbilla","Recta","San Carlos","Shipasbamba","Valera","Yambrasbamba"],"Chachapoyas":["Asuncion","Balsas","Chachapoyas","Cheto","Chiliquin","Chuquibamba","Granada","Huancas","La Jalca","Leimebamba","Levanto","Magdalena","Mariscal Castilla","Molinopampa","Montevideo","Olleros","Quinjalca","San Francisco de Daguas","San Isidro de Maino","Soloco","Sonche"],"Condorcanqui":["El Cenepa","Nieva","Rio Santiago"],"Luya":["Camporredondo","Cocabamba","Colcamar","Conila","Inguilpata","Lamud","Longuita","Lonya Chico","Luya","Luya Viejo","Maria","Ocalli","Ocumal","Pisuquia","Providencia","San Cristobal","San Francisco del Yeso","San Jeronimo","San Juan de Lopecancha","Santa Catalina","Santo Tomas","Tingo","Trita"],"Rodriguez de Mendoza":["Chirimoto","Cochamal","Huambo","Limabamba","Longar","Mariscal Benavides","Milpuc","Omia","San Nicolas","Santa Rosa","Totora","Vista Alegre"],"Utcubamba":["Bagua Grande","Cajaruro","Cumba","El Milagro","Jamalca","Lonya Grande","Yamon"]},"Ancash":{"Aija":["Aija","Coris","Huacllan","La Merced","Succha"],"Antonio Raymondi":["Aczo","Chaccho","Chingas","Llamellin","Mirgas","San Juan de Rontoy"],"Asuncion":["Acochaca","Chacas"],"Bolognesi":["Abelardo Pardo Lezameta","Antonio Raymondi","Aquia","Cajacay","Canis","Chiquian","Colquioc","Huallanca","Huasta","Huayllacayan","La Primavera","Mangas","Pacllon","San Miguel de Corpanqui","Ticllos"],"Carhuaz":["Acopampa","Amashca","Anta","Ataquero","Carhuaz","Marcara","Pariahuanca","San Miguel de Aco","Shilla","Tinco","Yungar"],"Carlos Fermin Fitzcarrald":["San Luis","San Nicolas","Yauya"],"Casma":["Buena Vista Alta","Casma","Comandante Noel","Yautan"],"Corongo":["Aco","Bambas","Corongo","Cusca","La Pampa","Yanac","Yupan"],"Huaraz":["Cochabamba","Colcabamba","Huanchay","Huaraz","Independencia","Jangas","La Libertad","Olleros","Pampas","Pariacoto","Pira","Tarica"],"Huari":["Anra","Cajay","Chavin de Huantar","Huacachi","Huacchis","Huachis","Huantar","Huari","Masin","Paucas","Ponto","Rahuapampa","Rapayan","San Marcos","San Pedro de Chana","Uco"],"Huarmey":["Cochapeti","Culebras","Huarmey","Huayan","Malvas"],"Huaylas":["Caraz","Huallanca","Huata","Huaylas","Mato","Pamparomas","Pueblo Libre","Santa Cruz","Santo Toribio","Yuracmarca"],"Mariscal Luzuriaga":["Casca","Eleazar Guzman Barron","Fidel Olivas Escudero","Llama","Llumpa","Lucma","Musga","Piscobamba"],"Ocros":["Acas","Cajamarquilla","Carhuapampa","Cochas","Congas","Llipa","Ocros","San Cristobal de Rajan","San Pedro","Santiago de Chilcas"],"Pallasca":["Bolognesi","Cabana","Conchucos","Huacaschuque","Huandoval","Lacabamba","Llapo","Pallasca","Pampas","Santa Rosa","Tauca"],"Pomabamba":["Huayllan","Parobamba","Pomabamba","Quinuabamba"],"Recuay":["Catac","Cotaparaco","Huayllapampa","Llacllin","Marca","Pampas Chico","Pararin","Recuay","Tapacocha","Ticapampa"],"Santa":["Caceres del Peru","Chimbote","Coishco","Macate","Moro","Nepeqa","Nuevo Chimbote","Samanco","Santa"],"Sihuas":["Acobamba","Alfonso Ugarte","Cashapampa","Chingalpo","Huayllabamba","Quiches","Ragash","San Juan","Sicsibamba","Sihuas"],"Yungay":["Cascapara","Mancos","Matacoto","Quillo","Ranrahirca","Shupluy","Yanama","Yungay"]},"Apurimac":{"Abancay":["Abancay","Chacoche","Circa","Curahuasi","Huanipaca","Lambrama","Pichirhua","San Pedro de Cachora","Tamburco"],"Andahuaylas":["Andahuaylas","Andarapa","Chiara","Huancarama","Huancaray","Huayana","Kaquiabamba","Kishuara","Pacobamba","Pacucha","Pampachiri","Pomacocha","San Antonio de Cachi","San Jeronimo","San Miguel de Chaccrampa","Santa Maria de Chicmo","Talavera","Tumay Huaraca","Turpo"],"Antabamba":["Antabamba","El Oro","Huaquirca","Juan Espinoza Medrano","Oropesa","Pachaconas","Sabaino"],"Aymaraes":["Capaya","Caraybamba","Chalhuanca","Chapimarca","Colcabamba","Cotaruse","Huayllo","Justo Apu Sahuaraura","Lucre","Pocohuanca","San Juan de Chacqa","Saqayca","Soraya","Tapairihua","Tintay","Toraya","Yanaca"],"Chincheros":["Anco-Huallo","Chincheros","Cocharcas","Huaccana","Ocobamba","Ongoy","Ranracancha","Uranmarca"],"Cotabambas":["Challhuahuacho","Cotabambas","Coyllurqui","Haquira","Mara","Tambobamba"],"Grau":["Chuquibambilla","Curasco","Curpahuasi","Gamarra","Huayllati","Mamara","Micaela Bastidas","Pataypampa","Progreso","San Antonio","Santa Rosa","Turpay","Vilcabamba","Virundo"]},"Arequipa":{"Arequipa":["Alto Selva Alegre","Arequipa","Cayma","Cerro Colorado","Characato","Chiguata","Jacobo Hunter","Jose Luis Bustamante y Rivero","La Joya","Mariano Melgar","Miraflores","Mollebaya","Paucarpata","Pocsi","Polobaya","Quequeqa","Sabandia","Sachaca","San Juan de Siguas","San Juan de Tarucani","Santa Isabel de Siguas","Santa Rita de Siguas","Socabaya","Tiabaya","Uchumayo","Vitor","Yanahuara","Yarabamba","Yura"],"Camana":["Camana","Jose Maria Quimper","Mariano Nicolas Valcarcel","Mariscal Caceres","Nicolas de Pierola","Ocoqa","Quilca","Samuel Pastor"],"Caraveli":["Acari","Atico","Atiquipa","Bella Union","Cahuacho","Caraveli","Chala","Chaparra","Huanuhuanu","Jaqui","Lomas","Quicacha","Yauca"],"Castilla":["Andagua","Aplao","Ayo","Chachas","Chilcaymarca","Choco","Huancarqui","Machaguay","Majes","Orcopampa","Pampacolca","Tipan","Uqon","Uraca","Viraco","Yanque"],"Caylloma":["Achoma","Cabanaconde","Callalli","Caylloma","Chivay","Coporaque","Huambo","Huanca","Ichupampa","Lari","Lluta","Maca","Madrigal","Majes","San Antonio de Chuca","Sibayo","Tapay","Tisco","Tuti","Yanque"],"Condesuyos":["Andaray","Cayarani","Chichas","Chuquibamba","Iray","Rio Grande","Salamanca","Yanaquihua"],"Islay":["Cocachacra","Dean Valdivia","Islay","Mejia","Mollendo","Punta de Bombon"],"La Union":["Alca","Charcana","Cotahuasi","Huaynacotas","Pampamarca","Puyca","Quechualla","Sayla","Tauria","Tomepampa","Toro"]},"Ayacucho":{"Cangallo":["Cangallo","Chuschi","Los Morochucos","Maria Parado de Bellido","Paras","Totos"],"Huamanga":["Acocro","Acos Vinchos","Ayacucho","Carmen Alto","Chiara","Jesús Nazareno","Ocros","Pacaycasa","Quinua","San Jose de Ticllas","San Juan Bautista","Santiago de Pischa","Socos","Tambillo","Vinchos"],"Huanca Sancos":["Carapo","Sacsamarca","Sancos","Santiago de Lucanamarca"],"Huanta":["Ayahuanco","Huamanguilla","Huanta","Iguain","Llochegua","Luricocha","Santillana","Sivia"],"La Mar":["Anco","Ayna","Chilcas","Chungui","Luis Carranza","San Miguel","Santa Rosa","Tambo"],"Lucanas":["Aucara","Cabana","Carmen Salcedo","Chaviqa","Chipao","Huac-Huas","Laramate","Leoncio Prado","Llauta","Lucanas","Ocaqa","Otoca","Puquio","Saisa","San Cristobal","San Juan","San Pedro","San Pedro de Palco","Sancos","Santa Ana de Huaycahuacho","Santa Lucia"],"Parinacochas":["Chumpi","Coracora","Coronel Castaqeda","Pacapausa","Pullo","Puyusca","San Francisco de Ravacayco","Upahuacho"],"Paucar del Sara Sara":["Colta","Corculla","Lampa","Marcabamba","Oyolo","Pararca","Pausa","San Javier de Alpabamba","San Jose de Ushua","Sara Sara"],"Sucre":["Belen","Chalcos","Chilcayoc","Huacaqa","Morcolla","Paico","Querobamba","San Pedro de Larcay","San Salvador de Quije","Santiago de Paucaray","Soras"],"Victor Fajardo":["Alcamenca","Apongo","Asquipata","Canaria","Cayara","Colca","Huamanquiquia","Huancapi","Huancaraylla","Huaya","Sarhua","Vilcanchos"],"Vilcas Huaman":["Accomarca","Carhuanca","Concepcion","Huambalpa","Independencia","Saurama","Vilcas Huaman","Vischongo"]},"Cajamarca":{"Cajabamba":["Cachachi","Cajabamba","Condebamba","Sitacocha"],"Cajamarca":["Asuncion","Cajamarca","Chetilla","Cospan","Encaqada","Jesus","Llacanora","Los Baqos del Inca","Magdalena","Matara","Namora","San Juan"],"Celendin":["Celendin","Chumuch","Cortegana","Huasmin","Jorge Chavez","Jose Galvez","La Libertad de Pallan","Miguel Iglesias","Oxamarca","Sorochuco","Sucre","Utco"],"Chota":["Anguia","Chadin","Chalamarca","Chiguirip","Chimban","Choropampa","Chota","Cochabamba","Conchan","Huambos","Lajas","Llama","Miracosta","Paccha","Pion","Querocoto","San Juan de Licupis","Tacabamba","Tocmoche"],"Contumaza":["Chilete","Contumaza","Cupisnique","Guzmango","San Benito","Santa Cruz de Toled","Tantarica","Yonan"],"Cutervo":["Callayuc","Choros","Cujillo","Cutervo","La Ramada","Pimpingos","Querocotillo","San Andres de Cutervo","San Juan de Cutervo","San Luis de Lucma","Santa Cruz","Santo Domingo de la Capilla","Santo Tomas","Socota","Toribio Casanova"],"Hualgayoc":["Bambamarca","Chugur","Hualgayoc"],"Jaen":["Bellavista","Chontali","Colasay","Huabal","Jaen","Las Pirias","Pomahuaca","Pucara","Sallique","San Felipe","San Jose del Alto","Santa Rosa"],"San Ignacio":["Chirinos","Huarango","La Coipa","Namballe","San Ignacio","San Jose de Lourdes","Tabaconas"],"San Marcos":["Chancay","Eduardo Villanueva","Gregorio Pita","Ichocan","Jose Manuel Quiroz","Jose Sabogal","Pedro Galvez"],"San Miguel":["Bolivar","Calquis","Catilluc","El Prado","La Florida","Llapa","Nanchoc","Niepos","San Gregorio","San Miguel","San Silvestre de Cochan","Tongod","Union Agua Blanca"],"San Pablo":["San Bernardino","San Luis","San Pablo","Tumbaden"],"Santa Cruz":["Andabamba","Catache","Chancaybaqos","La Esperanza","Ninabamba","Pulan","Santa Cruz","Saucepampa","Sexi","Uticyacu","Yauyucan"]},"Cusco":{"Acomayo":["Acomayo","Acopia","Acos","Mosoc Llacta","Pomacanchi","Rondocan","Sangarara"],"Anta":["Ancahuasi","Anta","Cachimayo","Chinchaypujio","Huarocondo","Limatambo","Mollepata","Pucyura","Zurite"],"Calca":["Calca","Coya","Lamay","Lares","Pisac","San Salvador","Taray","Yanatile"],"Canas":["Checca","Kunturkanki","Langui","Layo","Pampamarca","Quehue","Tupac Amaru","Yanaoca"],"Canchis":["Checacupe","Combapata","Marangani","Pitumarca","San Pablo","San Pedro","Sicuani","Tinta"],"Chumbivilcas":["Capacmarca","Chamaca","Colquemarca","Livitaca","Llusco","Quiqota","Santo Tomas","Velille"],"Cusco":["Ccorca","Cusco","Poroy","San Jeronimo","San Sebastian","Santiago","Saylla","Wanchaq"],"Espinar":["Alto Pichigua","Condoroma","Coporaque","Espinar","Ocoruro","Pallpata","Pichigua","Suyckutambo"],"La Convencion":["Echarate","Huayopata","Maranura","Ocobamba","Pichari","Quellouno","Quimbiri","Santa Ana","Santa Teresa","Vilcabamba"],"Paruro":["Accha","Ccapi","Colcha","Huanoquite","Omacha","Paccaritambo","Paruro","Pillpinto","Yaurisque"],"Paucartambo":["Caicay","Challabamba","Colquepata","Huancarani","Kosqipata","Paucartambo"],"Quispicanchi":["Andahuaylillas","Camanti","Ccarhuayo","Ccatca","Cusipata","Huaro","Lucre","Marcapata","Ocongate","Oropesa","Quiquijana","Urcos"],"Urubamba":["Chinchero","Huayllabamba","Machupicchu","Maras","Ollantaytambo","Urubamba","Yucay"]},"Huancavelica":{"Acobamba":["Acobamba","Andabamba","Anta","Caja","Marcas","Paucara","Pomacocha","Rosario"],"Angaraes":["Anchonga","Callanmarca","Ccochaccasa","Chincho","Congalla","Huanca-Huanca","Huayllay Grande","Julcamarca","Lircay","San Antonio de Antaparco","Santo Tomas de Pata","Secclla"],"Castrovirreyna":["Arma","Aurahua","Capillas","Castrovirreyna","Chupamarca","Cocas","Huachos","Huamatambo","Mollepampa","San Juan","Santa Ana","Tantara","Ticrapo"],"Churcampa":["Anco","Chinchihuasi","Churcampa","El Carmen","La Merced","Locroja","Pachamarca","Paucarbamba","San Miguel de Mayocc","San Pedro de Coris"],"Huancavelica":["Acobambilla","Acoria","Ascensión","Conayca","Cuenca","Huachocolpa","Huancavelica","Huando","Huayllahuara","Izcuchaca","Laria","Manta","Mariscal Caceres","Moya","Nuevo Occoro","Palca","Pilchaca","Vilca","Yauli"],"Huaytara":["Ayavi","Cordova","Huayacundo Arma","Huaytara","Laramarca","Ocoyo","Pilpichaca","Querco","Quito-Arma","San Antonio de Cusicancha","San Francisco de Sangayaico","San Isidro","Santiago de Chocorvos","Santiago de Quirahuara","Santo Domingo de Capillas","Tambo"],"Tayacaja":["Acostambo","Acraquia","Ahuaycha","Colcabamba","Daniel Hernandez","Huachocolpa","Huando","Huaribamba","Pachamarca","Pampas","Pazos","Qahuimpuquio","Quishuar","Salcabamba","Salcahuasi","San Marcos de Rocchac","Surcubamba","Tintay Puncu"]},"Huanuco":{"Ambo":["Ambo","Cayna","Colpas","Conchamarca","Huacar","San Francisco","San Rafael","Tomay Kichwa"],"Dos de Mayo":["Chuquis","La Union","Marias","Pachas","Quivilla","Ripan","Shunqui","Sillapata","Yanas"],"Huacaybamba":["Canchabamba","Cochabamba","Huacaybamba","Pinra"],"Huamalies":["Arancay","Chavin de Pariarca","Jacas Grande","Jircan","Llata","Miraflores","Monzon","Punchao","Puqos","Singa","Tantamayo"],"Huanuco":["Amarilis","Chinchao","Churubamba","Huanuco","Margos","Pillcomarca","Quisqui","San Francisco de Cayran","San Pedro de Chaulan","Santa Maria del Valle","Yarumayo"],"Lauricocha":["Baqos","Jesus","Jivia","Queropalca","Rondos","San Francisco de Asis","San Miguel de Cauri"],"Leoncio Prado":["Daniel Alomias Robles","Hermilio Valdizan","Jose Crespo y Castillo","Luyando","Mariano Damaso Beraun","Rupa-Rupa"],"Maraqon":["Cholon","Huacrachuco","San Buenaventura"],"Pachitea":["Chaglla","Molino","Panao","Umari"],"Puerto Inca":["Codo del Pozuzo","Honoria","Puerto Inca","Tournavista","Yuyapichis"],"Yarowilca":["Cahuac","Chacabamba","Chavinillo","Choras","Chupan","Jacas Chico","Obas","Pampamarca"]},"Ica":{"Chincha":["Alto Laran","Chavin","Chincha Alta","Chincha Baja","El Carmen","Grocio Prado","Pueblo Nuevo","San Juan de Yanac","San Pedro de Huacarpana","Sunampe","Tambo de Mora"],"Ica":["Ica","La Tinguiqa","Los Aquijes","Ocucaje","Pachacutec","Parcona","Pueblo Nuevo","Salas","San Jose de los Molinos","San Juan Bautista","Santiago","Subtanjalla","Tate","Yauca del Rosario  1/"],"Nazca":["Changuillo","El Ingenio","Marcona","Nazca","Vista Alegre"],"Palpa":["Llipata","Palpa","Rio Grande","Santa Cruz","Tibillo"],"Pisco":["Huancano","Humay","Independencia","Paracas","Pisco","San Andres","San Clemente","Tupac Amaru Inca"]},"Junin":{"Chanchamayo":["Chanchamayo","Perene","Pichanaqui","San Luis de Shuaro","San Ramon","Vitoc"],"Chupaca":["Ahuac","Chongos Bajo","Chupaca","Huachac","Huamancaca Chico","San Juan de Iscos","San Juan de Jarpa","Tres de Diciembre","Yanacancha"],"Concepcion":["Aco","Andamarca","Chambara","Cochas","Comas","Concepcion","Heroinas Toledo","Manzanares","Mariscal Castilla","Matahuasi","Mito","Nueve de Julio","Orcotuna","San Jose de Quero","Santa Rosa de Ocopa"],"Huancayo":["Carhuacallanga","Chacapampa","Chicche","Chilca","Chongos Alto","Chupuro","Colca","Cullhuas","El Tambo","Huacrapuquio","Hualhuas","Huancan","Huancayo","Huasicancha","Huayucachi","Ingenio","Pariahuanca","Pilcomayo","Pucara","Quichuay","Quilcas","San Agustin","San Jeronimo de Tunan","Santo Domingo de Acobamba","Sapallanga","Saqo","Sicaya","Viques"],"Jauja":["Acolla","Apata","Ataura","Canchayllo","Curicaca","El Mantaro","Huamali","Huaripampa","Huertas","Janjaillo","Jauja","Julcan","Leonor Ordoqez","Llocllapampa","Marco","Masma","Masma Chicche","Molinos","Monobamba","Muqui","Muquiyauyo","Paca","Paccha","Pancan","Parco","Pomacancha","Ricran","San Lorenzo","San Pedro de Chunan","Sausa","Sincos","Tunan Marca","Yauli","Yauyos"],"Junin":["Carhuamayo","Junin","Ondores","Ulcumayo"],"Satipo":["Coviriali","Llaylla","Mazamari","Pampa Hermosa","Pangoa","Rio Negro","Rio Tambo","Satipo"],"Tarma":["Acobamba","Huaricolca","Huasahuasi","La Union","Palca","Palcamayo","San Pedro de Cajas","Tapo","Tarma"],"Yauli":["Chacapalpa","Huay-Huay","La Oroya","Marcapomacocha","Morococha","Paccha","Santa Barbara de Carhuacayan","Santa Rosa de Sacco","Suitucancha","Yauli"]},"La Libertad":{"Ascope":["Ascope","Casa Grande","Chicama","Chocope","Magdalena de Cao","Paijan","Razuri","Santiago de Cao"],"Bolivar":["Bambamarca","Bolivar","Condormarca","Longotea","Uchumarca","Ucuncha"],"Chepen":["Chepen","Pacanga","Pueblo Nuevo"],"Gran Chimu":["Cascas","Lucma","Marmot","Sayapullo"],"Julcan":["Calamarca","Carabamba","Huaso","Julcan"],"Otuzco":["Agallpampa","Charat","Huaranchal","La Cuesta","Mache","Otuzco","Paranday","Salpo","Sinsicap","Usquil"],"Pacasmayo":["Guadalupe","Jequetepeque","Pacasmayo","San Jose","San Pedro de Lloc"],"Pataz":["Buldibuyo","Chillia","Huancaspata","Huaylillas","Huayo","Ongon","Parcoy","Pataz","Pias","Santiago de Challas","Taurija","Tayabamba","Urpay"],"Sanchez Carrion":["Chugay","Cochorco","Curgos","Huamachuco","Marcabal","Sanagoran","Sarin","Sartimbamba"],"Santiago de Chuco":["Angasmarca","Cachicadan","Mollebamba","Mollepata","Quiruvilca","Santa Cruz de Chuca","Santiago de Chuco","Sitabamba"],"Trujillo":["El Porvenir","Florencia de Mora","Huanchaco","La Esperanza","Laredo","Moche","Poroto","Salaverry","Simbal","Trujillo","Victor Larco Herrera"],"Viru":["Chao","Guadalupito","Viru"]},"Lambayeque":{"Chiclayo":["Cayaltí","Chiclayo","Chongoyape","Eten","Eten Puerto","Jose Leonardo Ortiz","La Victoria","Lagunas","Monsefu","Nueva Arica","Oyotun","Patapo","Picsi","Pimentel","Pomalca","Pucalá","Reque","Santa Rosa","Saqa","Tumán"],"Ferreqafe":["Caqaris","Ferreqafe","Incahuasi","Manuel Antonio Mesones Muro","Pitipo","Pueblo Nuevo"],"Lambayeque":["Chochope","Illimo","Jayanca","Lambayeque","Mochumi","Morrope","Motupe","Olmos","Pacora","Salas","San Jose","Tucume"]},"Lima":{"Barranca":["Barranca","Paramonga","Pativilca","Supe","Supe Puerto"],"Cajatambo":["Cajatambo","Copa","Gorgor","Huancapon","Manas"],"Callao":["Bellavista","Callao","Carmen de la Legua Reynoso","La Perla","La Punta","Ventanilla"],"Canta":["Arahuay","Canta","Huamantanga","Huaros","Lachaqui","San Buenaventura","Santa Rosa de Quives"],"Cañete":["Asia","Calango","Cerro Azul","Chilca","Coayllo","Imperial","Lunahuana","Mala","Nuevo Imperial","Pacaran","Quilmana","San Antonio","San Luis","San Vicente de Cañete","Santa Cruz de Flores","Zuqiga"],"Huaral":["Atavillos Alto","Atavillos Bajo","Aucallama","Chancay","Huaral","Ihuari","Lampian","Pacaraos","San Miguel de Acos","Santa Cruz de Andamarca","Sumbilca","Veintisiete de Noviembre"],"Huarochiri":["Antioquia","Callahuanca","Carampoma","Chicla","Cuenca","Huachupampa","Huanza","Huarochiri","Lahuaytambo","Langa","Laraos","Mariatana","Matucana","Ricardo Palma","San Andres de Tupicocha","San Antonio","San Bartolome","San Damian","San Juan de Iris","San Juan de Tantaranche","San Lorenzo de Quinti","San Mateo","San Mateo de Otao","San Pedro de Casta","San Pedro de Huancayre","Sangallaya","Santa Cruz de Cocachacra","Santa Eulalia","Santiago de Anchucaya","Santiago de Tuna","Santo Domingo de los Olleros","Surco"],"Huaura":["Ambar","Caleta de Carquin","Checras","Huacho","Hualmay","Huaura","Leoncio Prado","Paccho","Santa Leonor","Santa Maria","Sayan","Vegueta"],"Lima":["Ancon","Ate","Barranco","Breña","Carabayllo","Cercado de Lima","Chaclacayo","Chorrillos","Cieneguilla","Comas","El Agustino","Independencia","Jesus Maria","La Molina","La Victoria","Lince","Los Olivos","Lurigancho","Lurin","Magdalena del Mar","Miraflores","Pachacamac","Pucusana","Pueblo Libre","Puente Piedra","Punta Hermosa","Punta Negra","Rimac","San Bartolo","San Borja","San Isidro","San Juan de Lurigancho","San Juan de Miraflores","San Luis","San Martin de Porres","San Miguel","Santa Anita","Santa Maria del Mar","Santa Rosa","Santiago de Surco","Surquillo","Villa El Salvador","Villa Maria del Triunfo"],"Oyon":["Andajes","Caujul","Cochamarca","Navan","Oyon","Pachangara"],"Yauyos":["Alis","Ayauca","Ayaviri","Azangaro","Cacra","Carania","Catahuasi","Chocos","Cochas","Colonia","Hongos","Huampara","Huancaya","Huangascar","Huantan","Huaqec","Laraos","Lincha","Madean","Miraflores","Omas","Putinza","Quinches","Quinocay","San Joaquin","San Pedro de Pilas","Tanta","Tauripampa","Tomas","Tupe","Viqac","Vitis","Yauyos"]},"Loreto":{"Alto Amazonas":["Balsapuerto","Barranca","Cahuapanas","Jeberos","Lagunas","Manseriche","Morona","Pastaza","Santa Cruz","Teniente Cesar Lopez Rojas","Yurimaguas"],"Loreto":["Nauta","Parinari","Tigre","Trompeteros","Urarinas"],"Mariscal Ramon Castilla":["Pebas","Ramon Castilla","San Pablo","Yavari"],"Maynas":["Alto Nanay","Belén","Fernando Lores","Indiana","Iquitos","Las Amazonas","Mazan","Napo","Punchana","Putumayo","San Juan Bautista","Torres Causana","Yaquerana"],"Requena":["Alto Tapiche","Capelo","Emilio San Martin","Jenaro Herrera","Maquia","Puinahua","Requena","Saquena","Soplin","Tapiche","Yaquerana"],"Ucayali":["Contamana","Inahuaya","Padre Marquez","Pampa Hermosa","Sarayacu","Vargas Guerra"]},"Madre de Dios":{"Manu":["Fitzcarrald","Huepetuhe","Madre de Dios","Manu"],"Tahuamanu":["Iberia","Iqapari","Tahuamanu"],"Tambopata":["Inambari","Laberinto","Las Piedras","Tambopata"]},"Moquegua":{"General Sanchez Cerro":["Chojata","Coalaque","Ichuqa","La Capilla","Lloque","Matalaque","Omate","Puquina","Quinistaquillas","Ubinas","Yunga"],"Ilo":["El Algarrobal","Ilo","Pacocha"],"Mariscal Nieto":["Carumas","Cuchumbaya","Moquegua","Samegua","San Cristobal","Torata"]},"Pasco":{"Daniel Alcides Carrion":["Chacayan","Goyllarisquizga","Paucar","San Pedro de Pillao","Santa Ana de Tusi","Tapuc","Vilcabamba","Yanahuanca"],"Oxapampa":["Chontabamba","Huancabamba","Oxapampa","Palcazu","Pozuzo","Puerto Bermudez","Villa Rica"],"Pasco":["Chaupimarca","Huachon","Huariaca","Huayllay","Ninacaca","Pallanchacra","Paucartambo","San Fco.De Asis de Yarusyacan","Simon Bolivar","Ticlacayan","Tinyahuarco","Vicco","Yanacancha"]},"Piura":{"Ayabaca":["Ayabaca","Frias","Jilili","Lagunas","Montero","Pacaipampa","Paimas","Sapillica","Sicchez","Suyo"],"Huancabamba":["Canchaque","El Carmen de la Frontera","Huancabamba","Huarmaca","Lalaquiz","San Miguel de El Faique","Sondor","Sondorillo"],"Morropon":["Buenos Aires","Chalaco","Chulucanas","La Matanza","Morropon","Salitral","San Juan de Bigote","Santa Catalina de Mossa","Santo Domingo","Yamango"],"Paita":["Amotape","Arenal","Colan","La Huaca","Paita","Tamarindo","Vichayal"],"Piura":["Castilla","Catacaos","Cura Mori","El Tallan","La Arena","La Union","Las Lomas","Piura","Tambo Grande"],"Sechura":["Bellavista de la Union","Bernal","Cristo Nos Valga","Rinconada Llicuar","Sechura","Vice"],"Sullana":["Bellavista","Ignacio Escudero","Lancones","Marcavelica","Miguel Checa","Querecotillo","Salitral","Sullana"],"Talara":["El Alto","La Brea","Lobitos","Los Organos","Mancora","Pariqas"]},"Puno":{"Azangaro":["Achaya","Arapa","Asillo","Azangaro","Caminaca","Chupa","Jose Domingo Choquehuanca","Muqani","Potoni","Saman","San Anton","San Jose","San Juan de Salinas","Santiago de Pupuja","Tirapata"],"Carabaya":["Ajoyani","Ayapata","Coasa","Corani","Crucero","Ituata","Macusani","Ollachea","San Gaban","Usicayos"],"Chucuito":["Desaguadero","Huacullani","Juli","Kelluyo","Pisacoma","Pomata","Zepita"],"El Collao":["Capazo","Conduriri","Ilave","Pilcuyo","Santa Rosa"],"Huancane":["Cojata","Huancane","Huatasani","Inchupalla","Pusi","Rosaspata","Taraco","Vilque Chico"],"Lampa":["Cabanilla","Calapuja","Lampa","Nicasio","Ocuviri","Palca","Paratia","Pucara","Santa Lucia","Vilavila"],"Melgar":["Antauta","Ayaviri","Cupi","Llalli","Macari","Nuqoa","Orurillo","Santa Rosa","Umachiri"],"Moho":["Conima","Huayrapata","Moho","Tilali"],"Puno":["Acora","Amantani","Atuncolla","Capachica","Chucuito","Coata","Huata","Maqazo","Paucarcolla","Pichacani","Plateria","Puno","San Antonio","Tiquillaca","Vilque"],"San Antonio de Putina":["Ananea","Pedro Vilca Apaza","Putina","Quilcapuncu","Sina"],"San Roman":["Cabana","Cabanillas","Caracoto","Juliaca"],"Sandia":["Alto Inambari","Cuyocuyo","Limbani","Patambuco","Phara","Quiaca","San Juan del Oro","Sandia","Yanahuaya"],"Yunguyo":["Anapia","Copani","Cuturapi","Ollaraya","Tinicachi","Unicachi","Yunguyo"]},"San Martin":{"Bellavista":["Alto Biavo","Bajo Biavo","Bellavista","Huallaga","San Pablo","San Rafael"],"El Dorado":["Agua Blanca","San Jose de Sisa","San Martin","Santa Rosa","Shatoja"],"Huallaga":["Alto Saposoa","El Eslabon","Piscoyacu","Sacanche","Saposoa","Tingo de Saposoa"],"Lamas":["Alonso de Alvarado","Barranquita","Caynarachi","Cuqumbuqui","Lamas","Pinto Recodo","Rumisapa","San Roque de Cumbaza","Shanao","Tabalosos","Zapatero"],"Mariscal Caceres":["Campanilla","Huicungo","Juanjui","Pachiza","Pajarillo"],"Moyobamba":["Calzada","Habana","Jepelacio","Moyobamba","Soritor","Yantalo"],"Picota":["Buenos Aires","Caspisapa","Picota","Pilluana","Pucacaca","San Cristobal","San Hilarion","Shamboyacu","Tingo de Ponasa","Tres Unidos"],"Rioja":["Awajun","Elias Soplin Vargas","Nueva Cajamarca","Pardo Miguel","Posic","Rioja","San Fernando","Yorongos","Yuracyacu"],"San Martin":["Alberto Leveau","Cacatachi","Chazuta","Chipurana","El Porvenir","Huimbayoc","Juan Guerra","La Banda de Shilcayo","Morales","Papaplaya","San Antonio","Sauce","Shapaja","Tarapoto"],"Tocache":["Nuevo Progreso","Polvora","Shunte","Tocache","Uchiza"]},"Tacna":{"Candarave":["Cairani","Camilaca","Candarave","Curibaya","Huanuara","Quilahuani"],"Jorge Basadre":["Ilabaya","Ite","Locumba"],"Tacna":["Alto de la Alianza","Calana","Ciudad Nueva","Cor Gregorio Albarracín","Inclan","Pachia","Palca","Pocollay","Sama","Tacna"],"Tarata":["Chucatamani","Estique","Estique-Pampa","Sitajara","Susapaya","Tarata","Tarucachi","Ticaco"]},"Tumbes":{"Contralmirante Villar":["Casitas","Zorritos"],"Tumbes":["Corrales","La Cruz","Pampas de Hospital","San Jacinto","San Juan de la Virgen","Tumbes"],"Zarumilla":["Aguas Verdes","Matapalo","Papayal","Zarumilla"]},"Ucayali":{"Atalaya":["Raymondi","Sepahua","Tahuania","Yurua"],"Coronel Portillo":["Calleria","Campoverde","Iparia","Masisea","Nueva Requena","Yarinacocha"],"Padre Abad":["Curimana","Irazola","Padre Abad"],"Purus":["Purus"]}}},"Ecuador":{"l1":"Provincia","l2":"Cantón","l3":"Parroquia","tree":{"Azuay":{"Camilo Ponce Enríquez":["Camilo Ponce Enríquez","El Carmen de Pijilí"],"Chordeleg":["Chordeleg","La Unión","Luis Galarza Orellana (Cab.En Delegsol)","Principal","San Martín de Puzhio"],"Cuenca":["Baños","Bellavista","Cañaribamba","Chaucha","Checa (Jidcay)","Chiquintad","Cuenca","Cumbe","El Batán","El Sagrario","El Vecino","Gil Ramírez Dávalos","Hermano Miguel","Huaynacápac","Llacao","Machángara","Molleturo","Monay","Nulti","Octavio Cordero Palacios (Santa Rosa)","Paccha","Quingeo","Ricaurte","San Blas","San Joaquín","San Sebastián","Santa Ana","Sayausí","Sidcay","Sinincay","Sucre","Tarqui","Totoracocha","Turi","Valle","Victoria del Portete (Irquis)","Yanuncay"],"El Pan":["Amaluza","El Pan","Palmas","San Vicente"],"Girón":["Asunción","Girón","San Gerardo"],"Guachapala":["Guachapala"],"Gualaceo":["Chordeleg","Daniel Córdova Toral (El Oriente)","Gualaceo","Jadán","Luis Cordero Vega","Mariano Moreno","Principal","Remigio Crespo Toral (Gúlag)","San Juan","Simón Bolívar (Cab. En Gañanzol)","Zhidmad"],"Nabón":["Cochapata","El Progreso (Cab.En Zhota)","Las Nieves (Chaya)","Nabón","Oña"],"Oña":["San Felipe de Oña Cabecera Cantonal","Susudel"],"Paute":["Amaluza","Bulán (José Víctor Izquierdo)","Chicán (Guillermo Ortega)","Dug Dug","El Cabo","Guachapala","Guarainag","Palmas","Pan","Paute","San Cristóbal (Carlos Ordóñez Lazo)","Sevilla de Oro","Tomebamba"],"Pucara":["Camilo Ponce Enríquez (Cab. En Río 7 de Mollepongo)","Pucará","San Rafael de Sharug"],"San Fernando":["Chumblín","San Fernando"],"Santa Isabel":["Abdón Calderón (La Unión)","El Carmen de Pijilí","San Salvador de Cañaribamba","Santa Isabel (Chaguarurco)","Zhaglli (Shaglli)"],"Sevilla de Oro":["Amaluza","Palmas","Sevilla de Oro"],"Sigsig":["Cuchil (Cutchil)","Gima","Guel","Ludo","San Bartolomé","San José de Raranga","Sigsig"]},"Bolívar":{"Caluma":["Caluma"],"Chillanes":["Chillanes","San José del Tambo (Tambopamba)"],"Chimbo":["Asunción (Asancoto)","Caluma","Magdalena (Chapacoto)","San José de Chimbo","San Sebastián","Telimbela"],"Echeandía":["Echeandía"],"Guaranda":["Ángel Polibio Cháves","Facundo Vela","Gabriel Ignacio Veintimilla","Guanujo","Guanujo","Guaranda","Julio E. Moreno (Catanahuán Grande)","Las Naves","Salinas","San Lorenzo","San Luis de Pambil","San Simón (Yacoto)","Santa Fé (Santa Fé)","Simiátug"],"Las Naves":["Las Mercedes","Las Naves","Las Naves"],"San Miguel":["Balsapamba","Bilován","Régulo de Mora","San Miguel","San Pablo (San Pablo de Atenas)","San Vicente","Santiago"]},"Cañar":{"Azogues":["Aurelio Bayas Martínez","Azogues","Azogues","Borrero","Cojitambo","Déleg","Guapán","Javier Loyola (Chuquipata)","Luis Cordero","Pindilig","Rivera","San Francisco","San Miguel","Solano","Taday"],"Biblián":["Biblián","Jerusalén","Nazón (Cab. En Pampa de Domínguez)","San Francisco de Sageo","Turupamba"],"Cañar":["Cañar","Chontamarca","Chorocopte","Ducur","General Morales (Socarte)","Gualleturo","Honorato Vásquez (Tambo Viejo)","Ingapirca","Juncal","San Antonio","Suscal","Tambo","Ventura","Zhud"],"Déleg":["Déleg","Solano"],"El Tambo":["El Tambo"],"La Troncal":["La Troncal","Manuel J. Calle","Pancho Negro"],"Suscal":["Suscal"]},"Carchi":{"Bolívar":["Bolívar","Calceta","García Moreno","Los Andes","Membrillo","Monte Olivo","Quiroga","San Rafael","San Vicente de Pusir"],"Espejo":["27 de Septiembre","El Angel","El Ángel","El Goaltal","La Libertad (Alizo)","San Isidro"],"Mira":["Concepción","Jijón Y Caamaño (Cab. En Río Blanco)","Juan Montalvo (San Ignacio de Quil)","Mira (Chontahuasi)"],"Montúfar":["Chitán de Navarrete","Cristóbal Colón","Fernández Salvador","González Suárez","La Paz","Piartal","San Gabriel","San José"],"San Pedro de Huaca":["Huaca","Mariscal Sucre"],"Tulcán":["El Carmelo (El Pun)","El Chical","González Suárez","Huaca","Julio Andrade (Orejuela)","Maldonado","Mariscal Sucre","Pioter","Santa Martha de Cuba","Tobar Donoso (La Bocana de Camumbí)","Tufiño","Tulcán","Tulcán","Urbina (Taya)"]},"Chimborazo":{"Alausi":["Achupallas","Alausí","Cumandá","Guasuntos","Huigra","Multitud","Pistishí (Nariz del Diablo)","Pumallacta","Sevilla","Sibambe","Tixán"],"Chambo":["Chambo"],"Chunchi":["Capzol","Chunchi","Compud","Gonzol","Llagos"],"Colta":["Cajabamba","Cañi","Columbe","Juan de Velasco (Pangor)","Santiago de Quito (Cab. En San Antonio de Quito)","Sicalpa","Villa La Unión (Cajabamba)"],"Cumandá":["Cumandá"],"Guamote":["Cebadas","Guamote","Palmira"],"Guano":["El Rosario","Guanando","Guano","Ilapo","La Matriz","La Providencia","San Andrés","San Gerardo de Pacaicaguán","San Isidro de Patulú","San José del Chazo","Santa Fé de Galán","Valparaíso"],"Pallatanga":["Pallatanga"],"Penipe":["Bilbao (Cab.En Quilluyacu)","El Altar","La Candelaria","Matus","Penipe","Puela","San Antonio de Bayushig"],"Riobamba":["Cacha (Cab. En Machángara)","Calpi","Cubijíes","Flores","Licán","Licto","Lizarzaburu","Maldonado","Pungalá","Punín","Quimiag","Riobamba","San Juan","San Luis","Velasco","Veloz","Yaruquíes"]},"Cotopaxi":{"La Maná":["El Carmen","El Triunfo","Guasaganda (Cab.En Guasaganda","La Maná","La Maná","Pucayacu"],"Latacunga":["11 de Noviembre (Ilinchisi)","Alaques (Aláquez)","Belisario Quevedo (Guanailín)","Eloy Alfaro (San Felipe)","Guaitacama (Guaytacama)","Ignacio Flores (Parque Flores)","Joseguango Bajo","Juan Montalvo (San Sebastián)","La Matriz","Las Pampas","Latacunga","Mulaló","Palo Quemado","Poaló","San Buenaventura","San Juan de Pastocalle","Sigchos","Tanicuchí","Toacaso"],"Pangua":["El Corazón","Moraspungo","Pinllopata","Ramón Campaña"],"Pujili":["Angamarca","Chucchilán (Chugchilán)","Guangaje","Isinlibí (Isinliví)","La Victoria","Pilaló","Pujilí","Tingo","Zumbahua"],"Salcedo":["Antonio José Holguín (Santa Lucía)","Cusubamba","Mulalillo","Mulliquindil (Santa Ana)","Pansaleo","San Miguel"],"Saquisilí":["Canchagua","Chantilín","Cochapamba","Saquisilí"],"Sigchos":["Chugchillán","Isinliví","Las Pampas","Palo Quemado","Sigchos"]},"El Oro":{"Arenillas":["Arenillas","Carcabón","Chacras","La Libertad","Las Lajas (Cab. En La Victoria)","Palmales"],"Atahualpa":["Ayapamba","Cordoncillo","Milagro","Paccha","San José","San Juan de Cerro Azul"],"Balsas":["Balsas","Bellamaría"],"Chilla":["Chilla"],"El Guabo":["Barbones (Sucre)","El Guabo","La Iberia","Río Bonito","Tendales (Cab.En Puerto Tendales)"],"Huaquillas":["Ecuador","El Paraíso","Hualtaco","Huaquillas","Milton Reyes","Unión Lojana"],"Las Lajas":["El Paraíso","La Libertad","La Victoria","La Victoria","Platanillos","San Isidro","Valle Hermoso"],"Machala":["El Cambio","El Cambio","El Retiro","La Providencia","Machala","Machala","Nueve de Mayo","Puerto Bolívar"],"Marcabelí":["El Ingenio","Marcabelí"],"Pasaje":["Bolívar","Buenavista","Cañaquemada","Casacay","La Peaña","Loma de Franco","Ochoa León (Matriz)","Pasaje","Progreso","Tres Cerritos","Uzhcurrumi"],"Piñas":["Capiro (Cab. En La Capilla de Capiro)","La Bocana","La Matriz","La Susaya","Moromoro (Cab. En El Vado)","Piedras","Piñas","Piñas Grande","San Roque (Ambrosio Maldonado)","Saracay"],"Portovelo":["Curtincapa","Morales","Portovelo","Salatí"],"Santa Rosa":["Balneario Jambelí (Satélite)","Bellamaría","Bellavista","Jambelí","Jumón (Satélite)","La Avanzada","Nuevo Santa Rosa","Puerto Jelí","San Antonio","Santa Rosa","Santa Rosa","Torata","Victoria"],"Zaruma":["Abañín","Arcapamba","Guanazán","Guizhaguiña","Huertas","Malvas","Muluncay Grande","Salvias","Sinsao","Zaruma"]},"Esmeraldas":{"Atacames":["Atacames","La Unión","Súa (Cab. En La Bocana)","Tonchigüe","Tonsupa"],"Eloy Alfaro":["Anchayacu","Atahualpa (Cab. En Camarones)","Borbón","Colón Eloy del María","La Tola","Luis Vargas Torres (Cab. En Playa de Oro)","Maldonado","Pampanal de Bolívar","San Francisco de Onzole","San José de Cayapas","Santo Domingo de Onzole","Selva Alegre","Telembí","Timbiré","Valdez (Limones)"],"Esmeraldas":["5 de Agosto","Atacames","Bartolomé Ruiz (César Franco Carrión)","Camarones (Cab. En San Vicente)","Chinca","Chontaduro","Chumundé","Crnel. Carlos Concha Torres (Cab.En Huele)","Esmeraldas","Esmeraldas","La Unión","Lagarto","Luis Tello (Las Palmas)","Majua","Montalvo (Cab. En Horqueta)","Río Verde","Rocafuerte","San Mateo","Simón Plata Torres","Súa (Cab. En La Bocana)","Tabiazo","Tachina","Tonchigüe","Vuelta Larga"],"La Concordia":["La Concordia","La Villegas","Monterrey","Plan Piloto"],"Muisne":["Bolívar","Daule","Galera","Muisne","Quingue (Olmedo Perdomo Franco)","Salima","San Francisco","San Gregorio","San José de Chamanga (Cab.En Chamanga)"],"Quinindé":["Chura (Chancama) (Cab. En El Yerbero)","Cube","La Unión","Malimpia","Rosa Zárate (Quinindé)","Viche"],"Rioverde":["Chontaduro","Chumundé","Lagarto","Montalvo (Cab. En Horqueta)","Rioverde","Rocafuerte"],"San Lorenzo":["5 de Junio (Cab. En Uimbi)","Alto Tambo (Cab. En Guadual)","Ancón (Pichangal) (Cab. En Palma Real)","Calderón","Carondelet","Concepción","Mataje (Cab. En Santander)","San Javier de Cachaví (Cab. En San Javier)","San Lorenzo","Santa Rita","Tambillo","Tululbí (Cab. En Ricaurte)","Urbina"]},"Galápagos":{"Isabela":["Puerto Villamil","Tomás de Berlanga (Santo Tomás)"],"San Cristóbal":["El Progreso","Isla Santa María (Floreana) (Cab. En Pto. Velasco Ibarra)","Puerto Baquerizo Moreno"],"Santa Cruz":["Bellavista","Puerto Ayora","Santa Rosa (Incluye La Isla Baltra)"]},"Guayas":{"Alfredo Baquerizo Moreno (Juján)":["Alfredo Baquerizo Moreno (Juján)"],"Balao":["Balao"],"Balzar":["Balzar"],"Colimes":["Colimes","San Jacinto"],"Coronel Marcelino Maridueña":["Coronel Marcelino Maridueña (San Carlos)"],"Daule":["Banife","Daule","Daule","Emiliano Caicedo Marcos","Isidro Ayora (Soledad)","Juan Bautista Aguirre (Los Tintos)","La Aurora (Satélite)","Laurel","Limonal","Lomas de Sargentillo","Los Lojas (Enrique Baquerizo Moreno)","Magro","Padre Juan Bautista Aguirre","Piedrahita (Nobol)","Santa Clara","Vicente Piedrahita"],"Durán":["El Recreo","Eloy Alfaro (Durán)","Eloy Alfaro (Durán)"],"El Empalme":["El Rosario","Guayas (Pueblo Nuevo)","Velasco Ibarra (El Empalme)"],"El Triunfo":["El Triunfo"],"General Antonio Elizalde":["General Antonio Elizalde (Bucay)"],"Guayaquil":["Ayacucho","Bolívar (Sagrario)","Carbo (Concepción)","Chongón","Febres Cordero","García Moreno","Guayaquil","Juan Gómez Rendón (Progreso)","Letamendi","Morro","Nueve de Octubre","Olmedo (San Alejo)","Pascuales","Pascuales","Playas (Gral. Villamil)","Posorja","Puná","Roca","Rocafuerte","Sucre","Tarqui","Tenguel","Urdaneta","Ximena"],"Isidro Ayora":["Isidro Ayora"],"Lomas de Sargentillo":["Isidro Ayora (Soledad)","Lomas de Sargentillo"],"Milagro":["Chobo","General Elizalde (Bucay)","Mariscal Sucre (Huaques)","Milagro","Roberto Astudillo (Cab. En Cruce de Venecia)"],"Naranjal":["Jesús María","Naranjal","San Carlos","Santa Rosa de Flandes","Taura"],"Naranjito":["Naranjito"],"Nobol":["Narcisa de Jesús"],"Palestina":["Palestina"],"Pedro Carbo":["Pedro Carbo","Sabanilla","Valle de La Virgen"],"Playas":["General Villamil (Playas)"],"Salitre (Urbina Jado)":["Bocana","Candilejos","Central","El Salitre (Las Ramas)","Gral. Vernaza (Dos Esteros)","Junquillal","La Victoria (Ñauza)","Paraíso","San Mateo"],"Samborondón":["La Puntilla (Satélite)","Samborondón","Samborondón","Tarifa"],"San Jacinto de Yaguachi":["Crnel. Lorenzo de Garaicoa (Pedregal)","Crnel. Marcelino Maridueña (San Carlos)","Gral. Pedro J. Montero (Boliche)","San Jacinto de Yaguachi","Simón Bolívar","Virgen de Fátima","Yaguachi Viejo (Cone)"],"Santa Lucía":["Santa Lucía"],"Simón Bolívar":["Crnel.Lorenzo de Garaicoa (Pedregal)","Simón Bolívar"]},"Imbabura":{"Antonio Ante":["Andrade Marín (Lourdes)","Atuntaqui","Atuntaqui","Imbaya (San Luis de Cobuendo)","San Francisco de Natabuela","San José de Chaltura","San Roque"],"Cotacachi":["6 de Julio de Cuellaje (Cab. En Cuellaje)","Apuela","Cotacachi","García Moreno (Llurimagua)","Imantag","Peñaherrera","Plaza Gutiérrez (Calvario)","Quiroga","Sagrario","San Francisco","Vacas Galindo (El Churo) (Cab.En San Miguel Alto"],"Ibarra":["Ambuquí","Angochagua","Caranqui","Carolina","Guayaquil de Alpachaca","La Dolorosa del Priorato","La Esperanza","Lita","Sagrario","Salinas","San Antonio","San Francisco","San Miguel de Ibarra"],"Otavalo":["Dr. Miguel Egas Cabezas (Peguche)","Eugenio Espejo (Calpaquí)","González Suárez","Jordán","Otavalo","Pataquí","San José de Quichinche","San Juan de Ilumán","San Luis","San Pablo","San Rafael","Selva Alegre (Cab.En San Miguel de Pamplona)"],"Pimampiro":["Chugá","Mariano Acosta","Pimampiro","San Francisco de Sigsipamba"],"San Miguel de Urcuquí":["Cahuasquí","La Merced de Buenos Aires","Pablo Arenas","San Blas","Tumbabiro","Urcuquí Cabecera Cantonal"]},"Loja":{"Calvas":["Cariamanga","Cariamanga","Chile","Colaisaca","El Lucero","San Vicente","Sanguillín","Utuana"],"Catamayo":["Catamayo","Catamayo (La Toma)","El Tambo","Guayquichuma","San José","San Pedro de La Bendita","Zambi"],"Celica":["12 de Diciembre (Cab. En Achiotes)","Celica","Chaquinal","Cruzpamba (Cab. En Carlos Bustamante)","Pindal (Federico Páez)","Pozul (San Juan de Pozul)","Sabanilla","Tnte. Maximiliano Rodríguez Loaiza"],"Chaguarpamba":["Amarillos","Buenavista","Chaguarpamba","El Rosario","Santa Rufina"],"Espíndola":["27 de Abril (Cab. En La Naranja)","Amaluza","Bellavista","El Airo","El Ingenio","Jimbura","Santa Teresita"],"Gonzanamá":["Changaimina (La Libertad)","Fundochamba","Gonzanamá","Nambacola","Purunuma (Eguiguren)","Quilanga (La Paz)","Sacapalca","San Antonio de Las Aradas (Cab. En Las Aradas)"],"Loja":["Chantaco","Chuquiribamba","El Cisne","El Sagrario","Gualel","Jimbilla","Loja","Malacatos (Valladolid)","Quinara","San Lucas","San Pedro de Vilcabamba","San Sebastián","Santiago","Sucre","Taquil (Miguel Riofrío)","Valle","Vilcabamba (Victoria)","Yangana (Arsenio Castillo)"],"Macará":["General Eloy Alfaro (San Sebastián)","La Victoria","Larama","Macará","Macará (Manuel Enrique Rengel Suquilanda)","Sabiango (La Capilla)"],"Olmedo":["La Tingue","Olmedo","Olmedo"],"Paltas":["Cangonamá","Casanga","Catacocha","Catacocha","Guachanamá","La Tingue","Lauro Guerrero","Lourdes","Olmedo (Santa Bárbara)","Orianga","San Antonio","Yamana"],"Pindal":["12 de Diciembre (Cab.En Achiotes)","Chaquinal","Milagros","Pindal"],"Puyango":["Alamor","Ciano","El Arenal","El Limo (Mariana de Jesús)","Mercadillo","Vicentino"],"Quilanga":["Fundochamba","Quilanga","San Antonio de Las Aradas (Cab. En Las Aradas)"],"Saraguro":["El Paraíso de Celén","El Tablón","Lluzhapa","Manú","San Antonio de Qumbe (Cumbe)","San Pablo de Tenta","San Sebastián de Yúluc","Saraguro","Selva Alegre","Sumaypamba","Urdaneta (Paquishapa)"],"Sozoranga":["Nueva Fátima","Sozoranga","Tacamoros"],"Zapotillo":["Bolaspamba","Garzareal","Limones","Mangahurco (Cazaderos)","Paletillas","Zapotillo"]},"Los Rios":{"Baba":["Baba","Guare","Isla de Bejucal"],"Babahoyo":["Babahoyo","Barreiro","Barreiro (Santa Rita)","Caracol","Clemente Baquerizo","Dr. Camilo Ponce","El Salto","Febres Cordero (Las Juntas)","La Unión","Pimocha"],"Buena Fé":["11 de Octubre","7 de Agosto","Patricia Pilar","San Jacinto de Buena Fé","San Jacinto de Buena Fé"],"Mocache":["Mocache"],"Montalvo":["Montalvo"],"Palenque":["Palenque"],"Puebloviejo":["Puebloviejo","Puerto Pechiche","San Juan"],"Quevedo":["24 de Mayo","Buena Fé","Guayacán","La Esperanza","Mocache","Nicolás Infante Díaz","Quevedo","Quevedo","San Camilo","San Carlos","San Cristóbal","San José","Siete de Octubre","Valencia","Venus del Río Quevedo","Viva Alfaro"],"Quinsaloma":["Quinsaloma"],"Urdaneta":["Catarama","Ricaurte"],"Valencia":["Valencia"],"Ventanas":["10 de Noviembre","Chacarita","Los Ángeles","Quinsaloma","Ventanas","Zapotal"],"Vínces":["Antonio Sotomayor (Cab. En Playas de Vinces)","Palenque","Vinces"]},"Manabi":{"24 de Mayo":["Arq. Sixto Durán Ballén","Bellavista","Noboa","Sucre"],"Bolívar":[],"Chone":["Boyacá","Canuto","Chibunga","Chone","Chone","Convento","Eloy Alfaro","Ricaurte","San Antonio","Santa Rita"],"El Carmen":["4 de Diciembre","El Carmen","El Carmen","San Pedro de Suma","Wilfrido Loor Moreira (Maicito)"],"Flavio Alfaro":["Flavio Alfaro","San Francisco de Novillo (Cab. En","Zapallo"],"Jama":["Jama"],"Jaramijó":["Jaramijó"],"Jipijapa":["América","Dr. Miguel Morán Lucio","El Anegado (Cab. En Eloy Alfaro)","Jipijapa","Julcuy","La Unión","Machalilla","Manuel Inocencio Parrales Y Guale","Membrillal","Pedro Pablo Gómez","Puerto de Cayo","Puerto López","San Lorenzo de Jipijapa"],"Junín":["Junín"],"Manta":["Eloy Alfaro","Los Esteros","Manta","Manta","San Lorenzo","San Mateo","Santa Marianita (Boca de Pacoche)","Tarqui"],"Montecristi":["Anibal San Andrés","El Colorado","General Eloy Alfaro","Jaramijó","La Pila","Leonidas Proaño","Montecristi","Montecristi"],"Olmedo":[],"Paján":["Campozano (La Palma de Paján)","Cascol","Guale","Lascano","Paján"],"Pedernales":["10 de Agosto","Atahualpa","Cojimíes","Pedernales"],"Pichincha":["Barraganete","Pichincha","San Sebastián"],"Portoviejo":["12 de Marzo","18 de Octubre","Abdón Calderón (San Francisco)","Alhajuela (Bajo Grande)","Andrés de Vera","Chirijos","Colón","Crucita","Francisco Pacheco","Picoazá","Portoviejo","Portoviejo","Pueblo Nuevo","Riochico (Río Chico)","San Pablo","San Plácido","Simón Bolívar"],"Puerto López":["Machalilla","Puerto López","Salango"],"Rocafuerte":["Rocafuerte"],"San Vicente":["Canoa","San Vicente"],"Santa Ana":["Ayacucho","Honorato Vásquez (Cab. En Vásquez)","La Unión","Lodana","Olmedo","San Pablo (Cab. En Pueblo Nuevo)","Santa Ana","Santa Ana de Vuelta Larga"],"Sucre":["10 de Agosto","Bahía de Caráquez","Bahía de Caráquez","Canoa","Charapotó","Cojimíes","Jama","Leonidas Plaza Gutiérrez","Pedernales","San Isidro","San Vicente"],"Tosagua":["Angel Pedro Giler (La Estancilla)","Bachillero","Tosagua"]},"Morona Santiago":{"Gualaquiza":["Amazonas (Rosario de Cuyes)","Bermejos","Bomboiza","Chigüinda","El Ideal","El Rosario","Gualaquiza","Gualaquiza","Mercedes Molina","Nueva Tarqui","San Miguel de Cuyes"],"Huamboya":["Chiguaza","Huamboya","Pablo Sexto"],"Limón Indanza":["General Leonidas Plaza Gutiérrez (Limón)","Indanza","Pan de Azúcar","San Antonio (Cab. En San Antonio Centro","San Carlos de Limón (San Carlos del","San Juan Bosco","San Miguel de Conchay","Santa Susana de Chiviaza (Cab. En Chiviaza)","Yunganza (Cab. En El Rosario)"],"Logroño":["Logroño","Shimpis","Yaupi"],"Morona":["Alshi (Cab. En 9 de Octubre)","Chiguaza","Cuchaentza","General Proaño","Huasaga (Cab.En Wampuik)","Macas","Macuma","Río Blanco","San Isidro","San José de Morona","Sevilla Don Bosco","Sinaí","Taisha","Tuutinentza","Zuña (Zúñac)"],"Pablo Sexto":["Pablo Sexto"],"Palora":["Arapicos","Cumandá (Cab. En Colonia Agrícola Sevilla del Oro)","Huamboya","Palora (Metzera)","Sangay (Cab. En Nayamanaca)"],"San Juan Bosco":["Pan de Azúcar","San Carlos de Limón","San Jacinto de Wakambeis","San Juan Bosco","Santiago de Pananza"],"Santiago":["Chupianza","Copal","Patuca","San Francisco de Chinimbimi","San Luis de El Acho (Cab. En El Acho)","Santiago","Santiago de Méndez","Tayuza"],"Sucúa":["Asunción","Huambi","Logroño","Santa Marianita de Jesús","Sucúa","Yaupi"],"Taisha":["Huasaga (Cab. En Wampuik)","Macuma","Pumpuentsa","Taisha","Tuutinentza"],"Tiwintza":["San José de Morona","Santiago"]},"Napo":{"Archidona":["Archidona","Avila","Cotundo","Loreto","Puerto Murialdo","San Pablo de Ushpayacu"],"Carlos Julio Arosemena Tola":["Carlos Julio Arosemena Tola"],"El Chaco":["El Chaco","Gonzalo Díaz de Pineda (El Bombón)","Linares","Oyacachi","Santa Rosa","Sardinas"],"Quijos":["Baeza","Cosanga","Cuyuja","Papallacta","San Francisco de Borja (Virgilio Dávila)","San José del Payamino","Sumaco"],"Tena":["Ahuano","Carlos Julio Arosemena Tola (Zatza-Yacu)","Chontapunta","Pano","Puerto Misahualli","Puerto Napo","San Juan de Muyuna","Tálag","Tena"]},"Orellana":{"Aguarico":["Capitán Augusto Rivadeneyra","Cononaco","Nuevo Rocafuerte","Santa María de Huiririma","Tipitini","Tiputini","Yasuní"],"La Joya de Los Sachas":["Enokanqui","La Joya de Los Sachas","Lago San Pedro","Pompeya","Rumipamba","San Carlos","San Sebastián del Coca","Tres de Noviembre","Unión Milagreña"],"Loreto":["Avila (Cab. En Huiruno)","Loreto","Puerto Murialdo","San José de Dahuano","San José de Payamino","San Vicente de Huaticocha"],"Orellana":["Alejandro Labaka","Dayuma","El Dorado","El Edén","García Moreno","Inés Arango (Cab. En Western)","La Belleza","Nuevo Paraíso (Cab. En Unión","Puerto Francisco de Orellana (El Coca)","San José de Guayusa","San Luis de Armenia","Taracoa (Nueva Esperanza: Yuca)"]},"Pastaza":{"Arajuno":["Arajuno","Curaray"],"Mera":["Madre Tierra","Mera","Shell"],"Pastaza":["Arajuno","Canelos","Curaray","Diez de Agosto","El Triunfo","Fátima","Montalvo (Andoas)","Pomona","Puyo","Río Corrientes","Río Tigre","Santa Clara","Sarayacu","Simón Bolívar (Cab. En Mushullacta)","Tarqui","Teniente Hugo Ortiz","Veracruz (Indillama) (Cab. En Indillama)"],"Santa Clara":["San José","Santa Clara"]},"Pichincha":{"Cayambe":["Ascázubi","Ayora","Cangahua","Cayambe","Cayambe","Juan Montalvo","Olmedo (Pesillo)","Otón","Santa Rosa de Cuzubamba"],"Mejia":["Alóag","Aloasí","Cutuglahua","El Chaupi","Machachi","Manuel Cornejo Astorga (Tandapi)","Tambillo","Uyumbicho"],"Pedro Moncayo":["La Esperanza","Malchinguí","Tabacundo","Tocachi","Tupigachi"],"Pedro Vicente Maldonado":["Pedro Vicente Maldonado"],"Puerto Quito":["Puerto Quito"],"Quito":["Alangasí","Amaguaña","Atahualpa","Belisario Quevedo","Calacalí","Calderón","Carcelén","Centro Histórico","Chavezpamba","Checa","Chilibulo","Chillogallo","Chimbacalle","Cochapamba","Comité del Pueblo","Conocoto","Cotocollao","Cumbayá","El Condado","El Quinche","Gualea","Guamaní","Guangopolo","Guayllabamba","Iñaquito","Itchimbía","Jipijapa","Kennedy","La Argelia","La Concepción","La Ecuatoriana","La Ferroviaria","La Libertad","La Magdalena","La Mena","La Merced","Llano Chico","Lloa","Mariscal Sucre","Mindo","Nanegal","Nanegalito","Nayón","Nono","Pacto","Pedro Vicente Maldonado","Perucho","Pifo","Píntag","Pomasqui","Ponceano","Puéllaro","Puembo","Puengasí","Puerto Quito","Quito Distrito Metropolitano","Quitumbe","Rumipamba","San Antonio","San Bartolo","San Isidro del Inca","San José de Minas","San Juan","San Miguel de Los Bancos","Solanda","Tababela","Tumbaco","Turubamba","Yaruquí","Zambiza"],"Rumiñahui":["Cotogchoa","Rumipamba","San Pedro de Taboada","San Rafael","Sangolqui","Sangolquí"],"San Miguel de Los Bancos":["Mindo","Pedro Vicente Maldonado","Puerto Quito","San Miguel de Los Bancos"]},"Santa Elena":{"La Libertad":["La Libertad"],"Salinas":["Anconcito","Carlos Espinoza Larrea","Gral. Alberto Enríquez Gallo","José Luis Tamayo (Muey)","Salinas","Santa Rosa","Vicente Rocafuerte"],"Santa Elena":["Atahualpa","Ballenita","Chanduy","Colonche","Manglaralto","San José de Ancón","Santa Elena","Santa Elena","Simón Bolívar (Julio Moreno)"]},"Santo Domingo de Los Tsáchilas":{"Santo Domingo":["Abraham Calazacón","Alluriquín","Bombolí","Chiguilpe","El Esfuerzo","Luz de América","Puerto Limón","Río Toachi","Río Verde","San Jacinto del Búa","Santa María del Toachi","Santo Domingo de Los Colorados","Santo Domingo de Los Colorados","Valle Hermoso","Zaracay"]},"Sucumbíos":{"Cascales":["El Dorado de Cascales","Santa Rosa de Sucumbíos","Sevilla"],"Cuyabeno":["Aguas Negras","Cuyabeno","Tarapoa"],"Gonzalo Pizarro":["El Dorado de Cascales","El Reventador","Gonzalo Pizarro","Lumbaquí","Puerto Libre","Santa Rosa de Sucumbíos"],"Lago Agrio":["Aguas Negras","Cuyabeno","Dureno","El Eno","General Farfán","Jambelí","Nueva Loja","Pacayacu","Santa Cecilia","Tarapoa"],"Putumayo":["Palma Roja","Puerto Bolívar (Puerto Montúfar)","Puerto El Carmen del Putumayo","Puerto Rodríguez","Santa Elena"],"Shushufindi":["Limoncocha","Pañacocha","San Pedro de Los Cofanes","San Roque (Cab. En San Vicente)","Shushufindi","Siete de Julio"],"Sucumbíos":["El Playón de San Francisco","La Bonita","La Sofía","Rosa Florida","Santa Bárbara"]},"Tungurahua":{"Ambato":["Ambatillo","Ambato","Atahualpa (Chisalata)","Atocha – Ficoa","Augusto N. Martínez (Mundugleo)","Celiano Monge","Constantino Fernández (Cab. En Cullitahua)","Cunchibamba","Huachi Chico","Huachi Grande","Huachi Loreto","Izamba","Juan Benigno Vela","La Merced","La Península","Matriz","Montalvo","Pasa","Picaigua","Pilagüín (Pilahüín)","Pishilata","Quisapincha (Quizapincha)","San Bartolomé de Pinllog","San Fernando (Pasa San Fernando)","San Francisco","Santa Rosa","Totoras","Unamuncho"],"Baños de Agua Santa":["Baños de Agua Santa","Lligua","Río Negro","Río Verde","Ulba"],"Cevallos":["Cevallos"],"Mocha":["Mocha","Pinguilí"],"Patate":["El Triunfo","Los Andes (Cab. En Poatug)","Patate","Sucre (Cab. En Sucre-Patate Urcu)"],"Quero":["Quero","Rumipamba","Yanayacu - Mochapata (Cab. En Yanayacu)"],"San Pedro de Pelileo":["Benítez (Pachanlica)","Bolívar","Chiquicha (Cab. En Chiquicha Grande)","Cotaló","El Rosario (Rumichaca)","García Moreno (Chumaqui)","Guambaló (Huambaló)","Pelileo","Pelileo","Pelileo Grande","Salasaca"],"Santiago de Píllaro":["Baquerizo Moreno","Ciudad Nueva","Emilio María Terán (Rumipamba)","Marcos Espinel (Chacata)","Píllaro","Píllaro","Presidente Urbina (Chagrapamba -Patzucul)","San Andrés","San José de Poaló","San Miguelito"],"Tisaleo":["Quinchicoto","Tisaleo"]},"Zamora Chinchipe":{"Centinela del Cóndor":["Panguintza","Paquisha","Triunfo-Dorado","Zumbi"],"Chinchipe":["Chito","El Chorro","El Porvenir del Carmen","La Chonta","Palanda","Pucapamba","San Andrés","San Francisco del Vergel","Valladolid","Zumba"],"El Pangui":["El Guisme","El Pangui","Pachicutza","Tundayme"],"Nangaritza":["Guayzimi","Nuevo Paraíso","Zurmi"],"Palanda":["El Porvenir del Carmen","La Canela","Palanda","San Francisco del Vergel","Valladolid"],"Paquisha":["Bellavista","Nuevo Quito","Paquisha"],"Yacuambi":["28 de Mayo (San José de Yacuambi)","La Paz","Tutupali"],"Yantzaza (Yanzatza)":["Chicaña","El Pangui","Los Encuentros","Yantzaza (Yanzatza)"],"Zamora":["Cumbaratza","El Limón","Guadalupe","Imbana (La Victoria de Imbana)","Paquisha","Sabanilla","San Carlos de Las Minas","Timbara","Zamora","Zamora","Zumbi"]},"Zonas No Delimitadas":{"El Piedrero":[],"Las Golondrinas":["El Piedrero","Las Golondrinas","Manga del Cura"],"Manga del Cura":[]}}}}
const PAISES_UBIC = Object.keys(UBIC)
const nivel1De = (pais: string): string[] => UBIC[pais] ? Object.keys(UBIC[pais].tree) : []
const nivel2De = (pais: string, n1: string): string[] => (UBIC[pais] && UBIC[pais].tree[n1]) ? Object.keys(UBIC[pais].tree[n1]) : []
const ciudadesUbic = (pais: string, n1: string, n2: string): string[] => (UBIC[pais] && UBIC[pais].tree[n1] && UBIC[pais].tree[n1][n2]) ? UBIC[pais].tree[n1][n2] : []
// Para datos existentes: deduce nivel1/nivel2 a partir de la ciudad guardada.
function deducirUbic(pais: string, ciudad?: string): { region: string; departamento: string } | null {
  if (!UBIC[pais] || !ciudad) return null
  const c = ciudad.trim().toLowerCase()
  const t = UBIC[pais].tree
  for (const n1 of Object.keys(t)) for (const n2 of Object.keys(t[n1])) {
    if (t[n1][n2].some(x => x.toLowerCase() === c)) return { region: n1, departamento: n2 }
  }
  return null
}
// ── fin Ubicación multi-país ──

import { Seguimiento } from '@/shared/types/seguimiento'
import { logAudit, computarDiff } from '@/shared/lib/audit'
import { buildWhatsAppLink, isValidPhone } from '@/shared/lib/whatsapp'

const today = todayColombia()

const emptyCliente = (codigo: string): Cliente => ({
  id: '', codigo, tipo_identificacion: 'NIT',
  nro_documento: '', razon_social: '', nombre_comercial: '', actividad: '',
  direccion: '', region: '', departamento: '', ciudad: '', pais: 'Colombia', codigo_postal: '', telefono: '', email: '', sitio_web: '',
  condicion_pago: 'Contado', tipo_moneda: 'Pesos Colombianos', observaciones: '',
  situacion: 'Activo', fecha_registro: today, seguimientos: [], codigo_acceso: generarCodigoAcceso(),
})

export default function ClientesPage() {
  const t = useT()
  const ts = useTStatus()
  const idioma = useIdioma()
  const permisos = usePermisos('clientes')
  const currentUser = useCurrentUserStore(s => s.user)
  const router = useRouter()
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientesStore()
  const loadClientes = useClientesStore(s => s.loadClientes)
  const contactos = useContactosStore(s => s.contactos)
  const cotizaciones = useCotizacionesStore(s => s.cotizaciones)
  const oportunidades = useOportunidadesStore(s => s.oportunidades)
  const pqrs = usePQRSStore(s => s.pqrs)
  const refData = useReferenceStore(s => s.data)

  const [selected, setSelected] = useState<Cliente | null>(null)
  const [isForm, setIsForm] = useState(false)
  const [viewDetail, setViewDetail] = useState<Cliente | null>(null)
  const [verLectura, setVerLectura] = useState(false)
  const [correoModal, setCorreoModal] = useState<{ to: string; ref: string } | null>(null)
  const [tab, setTab] = useState<'registros' | 'reportes'>('registros')
  const [detailTab, setDetailTab] = useState<'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets'>('info')
  const [search, setSearch] = useState('')
  const { pendingSearch, pendingAction, clearPending } = useAsistenteStore()
  const searchParams = useSearchParams()
  useEffect(() => {
    if (pendingSearch) setSearch(pendingSearch)
    if (pendingAction === 'nuevo') { setSelected(emptyCliente(nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo)); setIsForm(true) }
    if (pendingSearch || pendingAction) clearPending()
  }, [])

  useEffect(() => { loadClientes() }, [loadClientes])

  useEffect(() => {
    const viewId = searchParams.get('view')
    const editId = searchParams.get('edit')
    const tabParam = searchParams.get('tab')
    if (viewId) {
      const cli = clientes.find(c => c.id === viewId)
      if (cli) {
        setViewDetail(cli)
        if (tabParam) setDetailTab(tabParam as 'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets')
      }
    } else if (editId) {
      const cli = clientes.find(c => c.id === editId)
      if (cli) {
        setSelected(cli); setIsForm(true)
        if (tabParam) setDetailTab(tabParam as 'info' | 'contactos' | 'cotizaciones' | 'oportunidades' | 'tickets')
      }
    }
  }, [searchParams, clientes])

  const filtered = clientes.filter(c =>
    !search || c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase()) ||
    c.nro_documento.includes(search)
  )

  const auditParams = () => ({
    usuario: currentUser?.usuario || 'desconocido',
    usuario_nombre: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim(),
    rol: currentUser?.rol || '',
    modulo: 'clientes',
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (selected.id) {
      const anterior = clientes.find(c => c.id === selected.id)
      updateCliente(selected.id, selected)
      logAudit({ ...auditParams(), accion: 'MODIFICAR', registro_codigo: selected.codigo, registro_nombre: selected.razon_social, detalle: computarDiff(anterior as unknown as Record<string, unknown>, selected as unknown as Record<string, unknown>) })
    } else {
      const id = crypto.randomUUID()
      addCliente({ ...selected, id, fecha_registro: today, creado_por: `${currentUser?.nombre || ''} ${currentUser?.apellido || ''}`.trim() || (currentUser?.usuario || 'desconocido'), creado_por_usuario: currentUser?.usuario || '', creado_en: today })
      logAudit({ ...auditParams(), accion: 'CREAR', registro_codigo: selected.codigo, registro_nombre: selected.razon_social, detalle: `Cliente creado` })
    }
    setIsForm(false); setSelected(null)
  }

  const statusStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      'activo': { background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa' },
      'inactivo': { background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b' },
      'prospecto': { background: 'transparent', color: '#facc15', border: '1px solid #facc15' },
      'prospectando': { background: 'transparent', color: '#facc15', border: '1px solid #facc15' },
    }
    return map[(s || '').trim().toLowerCase()] || {}
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, background: '#ffffff', border: '1px solid #1e3a8a', color: '#1e3a8a', fontWeight: 600, fontSize: 13, outline: 'none' }
  const btnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({ ...btnStyle, background: active ? '#1e3a8a' : 'rgba(255,255,255,0.15)', color: active ? '#ffffff' : '#0f172a', border: active ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)' })

  // View detail
  if (viewDetail) {
    const fields = [
      { label: t('lbl.codigo'), value: viewDetail.codigo },
      { label: t('lbl.tipoIdentificacion'), value: viewDetail.tipo_identificacion },
      { label: t('lbl.nroDocumento'), value: viewDetail.nro_documento },
      { label: t('lbl.razonSocial'), value: viewDetail.razon_social },
      { label: t('lbl.nombreComercial'), value: viewDetail.nombre_comercial },
      { label: t('lbl.actividad'), value: viewDetail.actividad },
      { label: t('lbl.telefono'), value: viewDetail.telefono },
      { label: t('lbl.email'), value: viewDetail.email },
      { label: t('lbl.sitioWeb'), value: viewDetail.sitio_web },
      { label: t('lbl.condicionPago'), value: viewDetail.condicion_pago },
      { label: t('lbl.moneda'), value: viewDetail.tipo_moneda },
      { label: t('lbl.situacion'), value: viewDetail.situacion },
      { label: t('lbl.fechaRegistro'), value: fDate(viewDetail.fecha_registro) },
      { label: t('lbl.observaciones'), value: viewDetail.observaciones },
    ]
    const cId = viewDetail.id
    const misContactos = contactos.filter(c => c.cliente_id === cId)
    const misCotizaciones = cotizaciones.filter(c => c.cliente_id === cId)
    const misOportunidades = oportunidades.filter(o => o.cliente_id === cId)
    const misTickets = pqrs.filter(p => p.cliente_id === cId)
    const calcTotalCot = (det: Array<{ subtotal: number }>, pct: number) => {
      const sub = det.reduce((s, d) => s + d.subtotal, 0); return sub + sub * (pct / 100)
    }
    const prioColor: Record<string, string> = { 'Urgente': '#fca5a5', 'Alta': '#fcd34d', 'Media': '#93c5fd', 'Baja': '#86efac' }
    const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }
    const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
    const tdMono: React.CSSProperties = { ...td, color: '#013978', fontFamily: 'monospace' }

    return (
      <div>
        <button onClick={() => { setViewDetail(null); setDetailTab('info') }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{viewDetail.razon_social}</h2>

          {/* Creado por — arriba, bien visible */}
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#fde68a', borderRadius: 12, border: '2px solid #000000', textAlign: 'left' }}>
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 800, marginBottom: 2 }}>👤 CREADO POR</p>
            <p style={{ color: '#000000', fontSize: 24, fontWeight: 900 }}>
              {viewDetail.creado_por || '—'}{viewDetail.creado_por_usuario ? ` (${viewDetail.creado_por_usuario})` : ''}{viewDetail.creado_en ? ` · ${viewDetail.creado_en}` : ''}
            </p>
          </div>

          {/* Sub-tabs de la vista detalle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <button onClick={() => setDetailTab('info')} style={tabBtnStyle(detailTab === 'info')}>🏢 Información</button>
            <button onClick={() => setDetailTab('contactos')} style={tabBtnStyle(detailTab === 'contactos')}>👤 Ver Contactos ({misContactos.length})</button>
            <button onClick={() => setDetailTab('cotizaciones')} style={tabBtnStyle(detailTab === 'cotizaciones')}>📄 Ver Cotizaciones ({misCotizaciones.length})</button>
            <button onClick={() => setDetailTab('oportunidades')} style={tabBtnStyle(detailTab === 'oportunidades')}>🎯 Ver Oportunidades ({misOportunidades.length})</button>
            <button onClick={() => setDetailTab('tickets')} style={tabBtnStyle(detailTab === 'tickets')}>🎫 Ver Tickets ({misTickets.length})</button>
          </div>

          {detailTab === 'contactos' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), t('lbl.cargo'), t('lbl.email'), t('lbl.celular'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misContactos.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                      <td style={td}>{c.cargo}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.celular || c.telefono || '—'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.situacion === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)', color: c.situacion === 'Activo' ? '#86efac' : '#d1d5db' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/contactos?open=${c.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=contactos`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misContactos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene contactos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'cotizaciones' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.fechaEmision'), t('lbl.fechaVencimiento'), t('lbl.total'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misCotizaciones.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{c.codigo}</td>
                      <td style={td}>{fDate(c.fecha_emision)}</td>
                      <td style={td}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(calcTotalCot(c.detalles || [], c.pct_impuesto || 0))}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/cotizaciones?open=${c.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=cotizaciones`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misCotizaciones.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene cotizaciones</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'oportunidades' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), idioma === 'en' ? 'Stage' : 'Etapa', t('lbl.montoEstimado'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misOportunidades.map((o, i) => (
                    <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{o.proyecto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>{o.veredicto}</span></td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(o.monto_estimado || 0)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{ts(o.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/oportunidades?open=${o.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=oportunidades`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misOportunidades.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene oportunidades</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'tickets' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.tipo'), t('lbl.prioridad'), t('lbl.asunto'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misTickets.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{p.codigo}</td>
                      <td style={td}>{p.tipo}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: prioColor[p.prioridad] || '#fff' }}>{p.prioridad}</span></td>
                      <td style={td}>{p.asunto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.situacion === 'Cerrada' ? 'rgba(156,163,175,0.2)' : 'rgba(239,68,68,0.2)', color: p.situacion === 'Cerrada' ? '#d1d5db' : '#fca5a5' }}>{ts(p.situacion)}</span></td>
                      <td style={td}><button onClick={() => router.push(`/pqrs?open=${p.id}&back=${encodeURIComponent(`/clientes?view=${viewDetail.id}&tab=tickets`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misTickets.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene tickets</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'info' && (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {fields.map(f => (
              <div key={f.label}>
                <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 16, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: t('lbl.direccion'), value: viewDetail.direccion },
                { label: t('lbl.ciudad'), value: viewDetail.ciudad },
                { label: t('lbl.pais'), value: viewDetail.pais },
                { label: t('lbl.codigoPostal'), value: viewDetail.codigo_postal },
              ].map(f => (
                <div key={f.label}>
                  <p style={{ color: '#013978', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>{f.label}</p>
                  <p style={{ color: '#013978', fontSize: 14 }}>{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Código de acceso PQRS */}
          {viewDetail.codigo_acceso && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(234,88,12,0.1)', borderRadius: 12, border: '1px solid rgba(234,88,12,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#f97316', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Código de Acceso para PQRS Público</p>
                <p style={{ color: '#013978', fontSize: 20, fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>{viewDetail.codigo_acceso}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(viewDetail.codigo_acceso); alert('Código copiado al portapapeles') }}
                style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', fontSize: 12 }}>Copiar</button>
            </div>
          )}

          <div style={{ marginTop: 16, padding: '12px 16px', background: '#eef2ff', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 800, marginBottom: 2 }}>👤 Creado por</p>
            <p style={{ color: '#000000', fontSize: 24, fontWeight: 900 }}>
              {viewDetail.creado_por || '—'}{viewDetail.creado_por_usuario ? ` (${viewDetail.creado_por_usuario})` : ''}{viewDetail.creado_en ? ` · ${viewDetail.creado_en}` : ''}
            </p>
          </div>
          {permisos.editar && (
            <button onClick={() => { setSelected(viewDetail); setIsForm(true); setViewDetail(null) }} style={{ ...btnStyle, background: '#2563eb', color: '#ffffff', border: '1px solid #3b82f6', marginTop: 16 }}>{t('btn.editar')}</button>
          )}
          <SeguimientoPanel
            seguimientos={viewDetail.seguimientos || []}
            usuario={`${currentUser?.nombre} ${currentUser?.apellido}`}
            situacionActual={viewDetail.situacion}
            situacionOpciones={refData.situacion_cliente.filter(r => r.situacion).map(r => r.descripcion)}
            onAdd={(seg: Seguimiento) => {
              const updated = { ...viewDetail, situacion: seg.situacion, seguimientos: [...(viewDetail.seguimientos || []), seg] }
              updateCliente(viewDetail.id, updated)
              setViewDetail(updated)
            }}
          />
          <DocumentosPanel modulo="clientes" registroId={viewDetail.id} />
          </>
          )}
        </div>
      </div>
    )
  }

  // Form
  if (isForm && selected) {
    const refOptions = (table: string) => (refData[table as keyof typeof refData] || []).filter(r => r.situacion).map(r => r.descripcion)
    // Ubicación Colombia (cascada Región → Departamento → Ciudad). Para registros antiguos deduce desde la ciudad guardada.
    const paisEff = selected.pais || 'Colombia'
    const ubicDed = (!selected.region && selected.ciudad) ? deducirUbic(paisEff, selected.ciudad) : null
    const regionEff = selected.region || ubicDed?.region || ''
    const deptoEff = selected.departamento || ubicDed?.departamento || ''
    const ciudadesDepto = ciudadesUbic(paisEff, regionEff, deptoEff)
    const cId = selected.id
    const misContactos = cId ? contactos.filter(c => c.cliente_id === cId) : []
    const misCotizaciones = cId ? cotizaciones.filter(c => c.cliente_id === cId) : []
    const misOportunidades = cId ? oportunidades.filter(o => o.cliente_id === cId) : []
    const misTickets = cId ? pqrs.filter(p => p.cliente_id === cId) : []
    const calcTotalCot = (det: Array<{ subtotal: number }>, pct: number) => {
      const sub = det.reduce((s, d) => s + d.subtotal, 0); return sub + sub * (pct / 100)
    }
    const prioColor: Record<string, string> = { 'Urgente': '#fca5a5', 'Alta': '#fcd34d', 'Media': '#93c5fd', 'Baja': '#86efac' }
    const th: React.CSSProperties = { padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }
    const td: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }
    const tdMono: React.CSSProperties = { ...td, color: '#013978', fontFamily: 'monospace' }

    return (
      <div>
        <button onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false); setDetailTab('info') }} style={{ ...btnStyle, background: '#000000', color: '#ffffff', border: '1px solid #333333', marginBottom: 16 }}>{t('btn.volver')}</button>
        <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, border: '1px solid #1e3a8a' }}>
          <h2 style={{ color: '#013978', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{verLectura ? (idioma === 'en' ? 'View Company' : 'Ver Empresa') : (selected.id ? t('fmt.editarCliente') : t('fmt.nuevoCliente'))} {selected.razon_social ? `— ${selected.razon_social}` : ''}</h2>

          {/* Sub-tabs en modo edición (solo si ya existe el cliente) */}
          {cId && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setDetailTab('info')} style={tabBtnStyle(detailTab === 'info')}>🏢 Información</button>
              <button type="button" onClick={() => setDetailTab('contactos')} style={tabBtnStyle(detailTab === 'contactos')}>👤 Contactos ({misContactos.length})</button>
              <button type="button" onClick={() => setDetailTab('cotizaciones')} style={tabBtnStyle(detailTab === 'cotizaciones')}>📄 Cotizaciones ({misCotizaciones.length})</button>
              <button type="button" onClick={() => setDetailTab('oportunidades')} style={tabBtnStyle(detailTab === 'oportunidades')}>🎯 Oportunidades ({misOportunidades.length})</button>
              <button type="button" onClick={() => setDetailTab('tickets')} style={tabBtnStyle(detailTab === 'tickets')}>🎫 Tickets ({misTickets.length})</button>
            </div>
          )}

          {cId && detailTab === 'contactos' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), t('lbl.cargo'), t('lbl.email'), t('lbl.celular'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misContactos.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{c.nombre} {c.apellido}</td>
                      <td style={td}>{c.cargo}</td>
                      <td style={td}>{c.email}</td>
                      <td style={td}>{c.celular || c.telefono || '—'}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: c.situacion === 'Activo' ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)', color: c.situacion === 'Activo' ? '#86efac' : '#d1d5db' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/contactos?open=${c.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=contactos`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misContactos.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene contactos registrados</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'cotizaciones' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.fechaEmision'), t('lbl.fechaVencimiento'), t('lbl.total'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misCotizaciones.map((c, i) => (
                    <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{c.codigo}</td>
                      <td style={td}>{fDate(c.fecha_emision)}</td>
                      <td style={td}>{fDate(c.fecha_vencimiento)}</td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(calcTotalCot(c.detalles || [], c.pct_impuesto || 0))}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(59,130,246,0.2)', color: '#93c5fd' }}>{ts(c.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/cotizaciones?open=${c.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=cotizaciones`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misCotizaciones.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene cotizaciones</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'oportunidades' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.nombre'), idioma === 'en' ? 'Stage' : 'Etapa', t('lbl.montoEstimado'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misOportunidades.map((o, i) => (
                    <tr key={o.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={{ ...td, color: '#fff', fontWeight: 600 }}>{o.proyecto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe' }}>{o.veredicto}</span></td>
                      <td style={{ ...td, color: '#013978', fontWeight: 700 }}>${fmtMoney(o.monto_estimado || 0)}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(34,197,94,0.2)', color: '#86efac' }}>{ts(o.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/oportunidades?open=${o.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=oportunidades`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misOportunidades.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene oportunidades</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {cId && detailTab === 'tickets' && (
            <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{[t('lbl.codigo'), t('lbl.tipo'), t('lbl.prioridad'), t('lbl.asunto'), t('lbl.situacion'), t('campo.acciones')].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
                <tbody>
                  {misTickets.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td style={tdMono}>{p.codigo}</td>
                      <td style={td}>{p.tipo}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: prioColor[p.prioridad] || '#fff' }}>{p.prioridad}</span></td>
                      <td style={td}>{p.asunto}</td>
                      <td style={td}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.situacion === 'Cerrada' ? 'rgba(156,163,175,0.2)' : 'rgba(239,68,68,0.2)', color: p.situacion === 'Cerrada' ? '#d1d5db' : '#fca5a5' }}>{ts(p.situacion)}</span></td>
                      <td style={td}><button type="button" onClick={() => router.push(`/pqrs?open=${p.id}&back=${encodeURIComponent(`/clientes?edit=${cId}&tab=tickets`)}`)} style={{ ...btnStyle, padding: '4px 12px', fontSize: 11, background: '#ea580c', color: '#fff', border: '1px solid #f97316' }}>Abrir</button></td>
                    </tr>
                  ))}
                  {misTickets.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#013978' }}>Este cliente no tiene tickets</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {(detailTab === 'info' || !cId) && (
        <form onSubmit={handleSave}>
          <fieldset disabled={verLectura} style={{ border: 'none', padding: 0, margin: 0, minInlineSize: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigo')}</label>
              {verLectura ? <div className="ver-box">{selected.codigo || '—'}</div> : <input value={selected.codigo} readOnly style={{ ...inputStyle, opacity: 0.5 }} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.fechaRegistro')}</label>
              {verLectura ? <div className="ver-box">{fDate(selected.fecha_registro || today) || '—'}</div> : <input value={fDate(selected.fecha_registro || today)} readOnly style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.tipoIdentificacion')}</label>
              {verLectura ? <div className="ver-box">{selected.tipo_identificacion || '—'}</div> : <select value={selected.tipo_identificacion} onChange={e => setSelected({ ...selected, tipo_identificacion: e.target.value })} style={inputStyle}>
                {refOptions('tipo_identificacion').map(o => <option key={o} value={o}>{o}</option>)}
              </select>}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nroDocumento')} *</label>
              {verLectura ? <div className="ver-box">{selected.nro_documento || '—'}</div> : <input value={selected.nro_documento} onChange={e => setSelected({ ...selected, nro_documento: e.target.value })} required style={inputStyle} />}
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.razonSocial')} *</label>
              {verLectura ? <div className="ver-box">{selected.razon_social || '—'}</div> : <input value={selected.razon_social} onChange={e => setSelected({ ...selected, razon_social: e.target.value.toUpperCase() })} required style={inputStyle} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.nombreComercial')}</label>
              {verLectura ? <div className="ver-box">{selected.nombre_comercial || '—'}</div> : <input value={selected.nombre_comercial} onChange={e => setSelected({ ...selected, nombre_comercial: e.target.value.toUpperCase() })} style={inputStyle} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.actividad')}</label>
              {verLectura ? <div className="ver-box">{selected.actividad || '—'}</div> : <select value={selected.actividad} onChange={e => setSelected({ ...selected, actividad: e.target.value })} style={inputStyle}>
                <option value="">{t("campo.seleccionar")}</option>
                {refOptions('actividad_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.telefono')}</label>
              {verLectura ? <div className="ver-box">{selected.telefono || '—'}</div> : <input value={selected.telefono} onChange={e => setSelected({ ...selected, telefono: e.target.value })} style={inputStyle} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.email')}</label>
              {verLectura ? <div className="ver-box">{selected.email || '—'}</div> : <input type="email" value={selected.email} onChange={e => setSelected({ ...selected, email: e.target.value })} style={inputStyle} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.sitioWeb')}</label>
              {verLectura ? <div className="ver-box">{selected.sitio_web || '—'}</div> : <input value={selected.sitio_web} onChange={e => setSelected({ ...selected, sitio_web: e.target.value })} style={inputStyle} />}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.condicionPago')}</label>
              {verLectura ? <div className="ver-box">{selected.condicion_pago || '—'}</div> : <select value={selected.condicion_pago} onChange={e => setSelected({ ...selected, condicion_pago: e.target.value })} style={inputStyle}>
                {refOptions('condiciones_pago').map(o => <option key={o} value={o}>{o}</option>)}
              </select>}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.moneda')}</label>
              {verLectura ? <div className="ver-box">{selected.tipo_moneda || '—'}</div> : <select value={selected.tipo_moneda} onChange={e => setSelected({ ...selected, tipo_moneda: e.target.value })} style={inputStyle}>
                {refOptions('tipo_moneda').map(o => <option key={o} value={o}>{o}</option>)}
              </select>}
            </div>
            <div>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.situacion')}</label>
              {verLectura ? <div className="ver-box">{selected.situacion || '—'}</div> : <select value={selected.situacion} onChange={e => setSelected({ ...selected, situacion: e.target.value })} style={inputStyle}>
                {refOptions('situacion_cliente').map(o => <option key={o} value={o}>{o}</option>)}
              </select>}
            </div>
          </div>

          {/* Ubicación */}
          <div style={{ marginTop: 20, padding: 16, background: '#f1f5f9', borderRadius: 12, border: '1px solid #1e3a8a' }}>
            <h3 style={{ color: '#013978', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{t('lbl.ubicacion')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.direccion')}</label>
                {verLectura ? <div className="ver-box">{selected.direccion || '—'}</div> : <input value={selected.direccion} onChange={e => setSelected({ ...selected, direccion: e.target.value })} style={inputStyle} />}
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.pais')}</label>
                {verLectura ? <div className="ver-box">{paisEff || '—'}</div> : <select value={paisEff} onChange={e => { const v = e.target.value; setSelected({ ...selected, pais: v, region: '', departamento: '', ciudad: '' }) }} style={inputStyle}>
                  {paisEff && !PAISES_UBIC.includes(paisEff) && <option value={paisEff}>{paisEff}</option>}
                  {PAISES_UBIC.map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Región</label>
                {verLectura ? <div className="ver-box">{regionEff || '—'}</div> : <select value={regionEff} onChange={e => { const v = e.target.value; const same = v === regionEff; setSelected({ ...selected, region: v, departamento: same ? deptoEff : '', ciudad: same ? selected.ciudad : '' }) }} style={inputStyle}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {nivel1De(paisEff).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Departamento (Provincia)</label>
                {verLectura ? <div className="ver-box">{deptoEff || '—'}</div> : <select value={deptoEff} onChange={e => { const v = e.target.value; const same = v === deptoEff; setSelected({ ...selected, region: regionEff, departamento: v, ciudad: same ? selected.ciudad : '' }) }} disabled={!regionEff} style={{ ...inputStyle, opacity: regionEff ? 1 : 0.5 }}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {nivel2De(paisEff, regionEff).map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.ciudad')}</label>
                {verLectura ? <div className="ver-box">{selected.ciudad || '—'}</div> : <select value={selected.ciudad} onChange={e => setSelected({ ...selected, region: regionEff, departamento: deptoEff, ciudad: e.target.value })} disabled={!deptoEff} style={{ ...inputStyle, opacity: deptoEff ? 1 : 0.5 }}>
                  <option value="">{t("campo.seleccionar")}</option>
                  {selected.ciudad && !ciudadesDepto.includes(selected.ciudad) && <option value={selected.ciudad}>{selected.ciudad}</option>}
                  {ciudadesDepto.map(o => <option key={o} value={o}>{o}</option>)}
                </select>}
              </div>
              <div>
                <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.codigoPostal')}</label>
                {verLectura ? <div className="ver-box">{(selected.codigo_postal || '') || '—'}</div> : <input value={selected.codigo_postal || ''} onChange={e => setSelected({ ...selected, codigo_postal: e.target.value })} style={inputStyle} />}
              </div>
            </div>
          </div>

          {/* Código de acceso PQRS */}
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(234,88,12,0.08)', borderRadius: 12, border: '1px solid rgba(234,88,12,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: '#f97316', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{idioma === 'en' ? 'Public PQRS Access Code' : 'Código de Acceso PQRS Público'}</label>
                {verLectura ? <div className="ver-box">{(selected.codigo_acceso || '') || '—'}</div> : <input value={selected.codigo_acceso || ''} readOnly style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 2, opacity: 0.8 }} />}
              </div>
              <button type="button" onClick={() => setSelected({ ...selected, codigo_acceso: generarCodigoAcceso() })}
                style={{ ...btnStyle, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316', fontSize: 12, marginTop: 18 }}>Regenerar</button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 6 }}>Este código permite a la empresa radicar PQRS desde el formulario público</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
            <div style={{ gridColumn: 'span 3' }}>
              <label style={{ color: '#013978', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t('lbl.observaciones')}</label>
              {verLectura ? <div className="ver-box">{selected.observaciones || '—'}</div> : <textarea value={selected.observaciones} onChange={e => setSelected({ ...selected, observaciones: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />}
            </div>
          </div>
          </fieldset>
          {/* Creado por — pequeño, al final después de Observaciones (solo en modo Ver) */}
          {verLectura && (
            <p style={{ color: '#000000', fontSize: 13, fontWeight: 700, marginTop: 14 }}>
              👤 Creado por: {selected.creado_por || '—'}{selected.creado_por_usuario ? ` (${selected.creado_por_usuario})` : ''}{selected.creado_en ? ` · ${selected.creado_en}` : ''}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!verLectura && <button type="submit" style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('btn.guardar')}</button>}
            <button type="button" onClick={() => { setIsForm(false); setSelected(null); setVerLectura(false) }} style={{ ...btnStyle, background: '#64748b', color: '#ffffff' }}>{verLectura ? t('btn.volver') : t('btn.cancelar')}</button>
          </div>
        </form>
          )}
          {selected.id && <DocumentosPanel modulo="clientes" registroId={selected.id} />}
        </div>
      </div>
    )
  }

  // Report data
  const reportColumns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Razón Social', key: 'razon_social', width: 25 },
    { header: 'NIT/Doc', key: 'nro_documento', width: 14 },
    { header: 'Ciudad', key: 'ciudad', width: 12 },
    { header: 'Teléfono', key: 'telefono', width: 12 },
    { header: 'Email', key: 'email', width: 18 },
    { header: 'Actividad', key: 'actividad', width: 14 },
    { header: 'Situación', key: 'situacion', width: 10 },
  ]
  const reportRows = filtered.map(c => ({
    codigo: c.codigo, razon_social: c.razon_social, nro_documento: c.nro_documento,
    ciudad: c.ciudad, telefono: c.telefono, email: c.email, actividad: c.actividad, situacion: c.situacion,
  }))
  const reportFilters = [
    { label: 'Situación', key: 'situacion', options: [...new Set(clientes.map(c => c.situacion).filter(Boolean))] },
    { label: 'Ciudad', key: 'ciudad', options: [...new Set(clientes.map(c => c.ciudad).filter(Boolean))] },
    { label: 'Actividad', key: 'actividad', options: [...new Set(clientes.map(c => c.actividad).filter(Boolean))] },
  ]

  return (
    <div>
      <ModuleHeader title={t('page.clientes.title')} subtitle={t('page.clientes.subtitle')} />

      {permisos.crear && tab === 'registros' && (
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => { setSelected(emptyCliente(nextConsecutivo('CLI-', clientes.map(c => c.codigo)).codigo)); setIsForm(true) }} style={{ ...btnStyle, background: '#1e3a8a', color: '#ffffff' }}>{t('page.clientes.btnNuevo')}</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab('registros')} style={tabBtnStyle(tab === 'registros')}>📋 {t('tab.registros')}</button>
        <button onClick={() => setTab('reportes')} style={tabBtnStyle(tab === 'reportes')}>📊 {t('tab.reportes')}</button>
      </div>

      {tab === 'registros' && (
        <>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('ph.buscarCliente')}
            style={{ ...inputStyle, maxWidth: 400, marginBottom: 16 }} />

          <div style={{ borderRadius: 12, border: '1px solid #1e3a8a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[t('lbl.codigo'), t('lbl.razonSocial'), t('lbl.tipoIdentificacion'), t('lbl.nroDocumento'), t('lbl.direccion'), t('lbl.ciudad'), t('lbl.pais'), t('lbl.telefono'), t('lbl.situacion'), idioma === 'en' ? 'Actions' : 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', background: '#1e3a8a', color: '#fff', fontSize: 12, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13, fontFamily: 'monospace' }}>{c.codigo}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.razon_social}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.tipo_identificacion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.nro_documento}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.direccion}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.ciudad}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.pais}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#013978', fontSize: 13 }}>{c.telefono}</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, ...statusStyle(c.situacion) }}>{ts(c.situacion)}</span>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setSelected(c); setVerLectura(true); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#ea580c', color: '#ffffff', border: '1px solid #f97316' }}>Ver</button>
                        <button onClick={() => setCorreoModal({ to: c.email || '', ref: c.codigo })} title="Enviar correo" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#0ea5e9', color: '#ffffff', border: '1px solid #38bdf8' }}>✉</button>
                        {isValidPhone(c.telefono) && (
                          <a href={buildWhatsAppLink(c.telefono, idioma === 'en' ? `Hi ${c.razon_social}, this is a quick message from us.` : `Hola ${c.razon_social}, te escribimos desde nuestra empresa.`)} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#25d366', color: '#ffffff', border: '1px solid #128c7e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WA</a>
                        )}
                        {permisos.editar && <button onClick={() => { setSelected(c); setIsForm(true) }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#15803d', color: '#ffffff', border: '1px solid #16a34a' }}>Edit</button>}
                        {permisos.eliminar && <button onClick={() => {
                          if (!confirm(`¿Eliminar cliente "${c.razon_social}"?`)) return
                          deleteCliente(c.id)
                          logAudit({ ...auditParams(), accion: 'ELIMINAR', registro_codigo: c.codigo, registro_nombre: c.razon_social, detalle: 'Cliente eliminado' })
                        }} style={{ ...btnStyle, padding: '3px 10px', fontSize: 10, background: '#dc2626', color: '#ffffff', border: '1px solid #ef4444' }}>Elim</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#013978', fontSize: 14 }}>No hay empresas registradas</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'reportes' && (
        <ReportPanel title="Reporte de Clientes" columns={reportColumns} rows={reportRows} filters={reportFilters} />
      )}

      {correoModal && (
        <EnviarCorreoModal destinatario={correoModal.to} modulo="clientes" referencia={correoModal.ref} onClose={() => setCorreoModal(null)} />
      )}
    </div>
  )
}
