import { type Presupuesto } from './store/presupuesto-store'

export const SEED_PRESUPUESTOS: Presupuesto[] = [
  {
    "id": "pres-edif-pr2",
    "nro": 1,
    "consecutivo": "PRES-00001",
    "proyecto": "Edificio Multifamiliar — 5 pisos (40 aptos)",
    "fecha": "2026-07-12",
    "observaciones": "Presupuesto de obra del proyecto (oferta PR-00002).",
    "renglones": [
      {
        "id": "814ef9d7-ad63-46c9-955a-a6f8f0d87b7f",
        "codigo": "1",
        "descripcion": "E-01 · ESTUDIOS, DISEÑOS, LICENCIAS Y PÓLIZAS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "3e802d26-0819-436b-bd8f-34ede731c0ff",
        "codigo": "1.01",
        "descripcion": "Dirección de preconstrucción y coordinación de diseños",
        "proyectado": 3,
        "proyectado_val": 30187.5,
        "asignado": 3,
        "asignado_val": 30187.5
      },
      {
        "id": "4f3deda3-1024-4cfb-9a15-0e1ef167d18e",
        "codigo": "1.02",
        "descripcion": "Subcontrato: Estudio de suelos y geotecnia",
        "proyectado": 1,
        "proyectado_val": 23184,
        "asignado": 1,
        "asignado_val": 23184
      },
      {
        "id": "4575a364-6c56-4dc5-9c76-b69d762b3e8d",
        "codigo": "1.03",
        "descripcion": "Subcontrato: Diseños estructural, hidrosanitario y eléctrico",
        "proyectado": 1,
        "proyectado_val": 122360,
        "asignado": 1,
        "asignado_val": 122360
      },
      {
        "id": "a0ff7de6-0668-41c8-a0a1-dc9472580896",
        "codigo": "1.04",
        "descripcion": "Licencia de construcción y curaduría urbana",
        "proyectado": 1,
        "proyectado_val": 107525,
        "asignado": 1,
        "asignado_val": 107525
      },
      {
        "id": "1fd0fa05-62b1-4805-b338-e6d6617ff00a",
        "codigo": "1.05",
        "descripcion": "Pólizas: cumplimiento, estabilidad y RCE",
        "proyectado": 1,
        "proyectado_val": 53130,
        "asignado": 1,
        "asignado_val": 53130
      },
      {
        "id": "b7d5b287-f636-464b-94a6-c2a572456962",
        "codigo": "2",
        "descripcion": "E-02 · OBRAS PRELIMINARES Y LIMPIEZA DEL TERRENO",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "1e66e76e-e1d2-4fe8-afbb-1859aeb73a41",
        "codigo": "2.01",
        "descripcion": "Cuadrilla de limpieza, desmonte y descapote",
        "proyectado": 40,
        "proyectado_val": 19136,
        "asignado": 40,
        "asignado_val": 19136
      },
      {
        "id": "9985e004-3c37-4914-9ba6-b61b76bcc39c",
        "codigo": "2.02",
        "descripcion": "Trazado y replanteo topográfico",
        "proyectado": 12,
        "proyectado_val": 6712.32,
        "asignado": 12,
        "asignado_val": 6712.32
      },
      {
        "id": "26be6671-aeff-4fb5-a094-3464bc067bc1",
        "codigo": "2.03",
        "descripcion": "Residente de obra (dirección técnica)",
        "proyectado": 10,
        "proyectado_val": 97175,
        "asignado": 10,
        "asignado_val": 97175
      },
      {
        "id": "cdebaa39-5e4f-4e36-b72f-1ede05129bb2",
        "codigo": "2.04",
        "descripcion": "Maestro general de obra",
        "proyectado": 10,
        "proyectado_val": 56810,
        "asignado": 10,
        "asignado_val": 56810
      },
      {
        "id": "35f16f13-ae0b-41c4-8086-6e4c28e79e22",
        "codigo": "2.05",
        "descripcion": "Cerramiento provisional en tela verde + postes",
        "proyectado": 180,
        "proyectado_val": 7948.8,
        "asignado": 180,
        "asignado_val": 7948.8
      },
      {
        "id": "5018d92b-3d65-4e76-b073-3d0beec89145",
        "codigo": "2.06",
        "descripcion": "Caseta / almacén provisional de obra",
        "proyectado": 1,
        "proyectado_val": 11534.5,
        "asignado": 1,
        "asignado_val": 11534.5
      },
      {
        "id": "02e64a31-4dee-4c21-a49b-a8462d35f04d",
        "codigo": "2.07",
        "descripcion": "Alquiler generador eléctrico de obra",
        "proyectado": 10,
        "proyectado_val": 43424,
        "asignado": 10,
        "asignado_val": 43424
      },
      {
        "id": "af33a80a-f63e-4946-bbeb-2c1194a3f065",
        "codigo": "3",
        "descripcion": "E-03 · MOVIMIENTO DE TIERRAS Y EXCAVACIÓN",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "b91e5ddd-d913-4103-b1ec-312193330557",
        "codigo": "3.01",
        "descripcion": "Cuadrilla de excavación y perfilado",
        "proyectado": 60,
        "proyectado_val": 30498,
        "asignado": 60,
        "asignado_val": 30498
      },
      {
        "id": "62745001-cfa4-4400-b254-9fba40de7a53",
        "codigo": "3.02",
        "descripcion": "Comisión topográfica de control",
        "proyectado": 6,
        "proyectado_val": 37674,
        "asignado": 6,
        "asignado_val": 37674
      },
      {
        "id": "93fb4b9a-2a90-4380-8b31-57a703265c6b",
        "codigo": "3.03",
        "descripcion": "Alquiler volqueta retiro de material (viaje)",
        "proyectado": 90,
        "proyectado_val": 21983.4,
        "asignado": 90,
        "asignado_val": 21983.4
      },
      {
        "id": "05079553-9270-4cb0-9783-1c99bf5b3068",
        "codigo": "3.04",
        "descripcion": "Alquiler retroexcavadora (hora-máquina)",
        "proyectado": 120,
        "proyectado_val": 23611.8,
        "asignado": 120,
        "asignado_val": 23611.8
      },
      {
        "id": "32bd65d8-2458-4a03-b502-388efc7c0cca",
        "codigo": "3.05",
        "descripcion": "Compresor + martillo neumático (perforación)",
        "proyectado": 30,
        "proyectado_val": 11398.8,
        "asignado": 30,
        "asignado_val": 11398.8
      },
      {
        "id": "d0837dd3-e70a-4131-82f0-830b04640408",
        "codigo": "4",
        "descripcion": "E-04 · CIMENTACIÓN Y CONTENCIÓN",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "cde8a9d2-d9c6-492b-8872-901c559a90e1",
        "codigo": "4.01",
        "descripcion": "Cuadrilla armado de acero y fundida",
        "proyectado": 90,
        "proyectado_val": 48438,
        "asignado": 90,
        "asignado_val": 48438
      },
      {
        "id": "20b8d699-1ff7-45f1-909c-304c4cf29046",
        "codigo": "4.02",
        "descripcion": "Ingeniero de calidad / interventoría interna",
        "proyectado": 10,
        "proyectado_val": 77740,
        "asignado": 10,
        "asignado_val": 77740
      },
      {
        "id": "224cccda-a9c4-42a1-8076-6d8eeb7e89f2",
        "codigo": "4.03",
        "descripcion": "Concreto premezclado 3.000 psi",
        "proyectado": 320,
        "proyectado_val": 229632,
        "asignado": 320,
        "asignado_val": 229632
      },
      {
        "id": "a059294b-96ba-4658-841b-fff781dad4d3",
        "codigo": "4.04",
        "descripcion": "Acero de refuerzo 60.000 psi",
        "proyectado": 38000,
        "proyectado_val": 268143.2,
        "asignado": 38000,
        "asignado_val": 268143.2
      },
      {
        "id": "45de35e6-dc28-4356-bd1f-7294fefc6dad",
        "codigo": "4.05",
        "descripcion": "Malla electrosoldada",
        "proyectado": 850,
        "proyectado_val": 21114,
        "asignado": 850,
        "asignado_val": 21114
      },
      {
        "id": "56a3d44e-935e-44e1-a839-6ca8df9f1817",
        "codigo": "4.06",
        "descripcion": "Taladro perforador roto-percutor (anclajes / pernos)",
        "proyectado": 45,
        "proyectado_val": 5899.5,
        "asignado": 45,
        "asignado_val": 5899.5
      },
      {
        "id": "09c5f5d5-bc17-46ee-9727-66715a5befec",
        "codigo": "4.07",
        "descripcion": "Equipo de perforación pilotes / micropilotes",
        "proyectado": 20,
        "proyectado_val": 32568,
        "asignado": 20,
        "asignado_val": 32568
      },
      {
        "id": "0f79e98a-766e-41ae-bc38-1150631105c3",
        "codigo": "5",
        "descripcion": "E-05 · ESTRUCTURA EN CONCRETO",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "0821529f-c448-4c11-8044-f33fcfe54971",
        "codigo": "5.01",
        "descripcion": "Cuadrilla estructura (columnas, vigas, placas)",
        "proyectado": 220,
        "proyectado_val": 120225.6,
        "asignado": 220,
        "asignado_val": 120225.6
      },
      {
        "id": "73514fa6-6b63-4fc6-97d0-8f27a5b5d68d",
        "codigo": "5.02",
        "descripcion": "Concreto premezclado 4.000 psi",
        "proyectado": 540,
        "proyectado_val": 417312,
        "asignado": 540,
        "asignado_val": 417312
      },
      {
        "id": "8ca1a41b-b91a-4cb1-bbf4-dfbc378febda",
        "codigo": "5.03",
        "descripcion": "Acero de refuerzo figurado",
        "proyectado": 62000,
        "proyectado_val": 445910.2,
        "asignado": 62000,
        "asignado_val": 445910.2
      },
      {
        "id": "e03f60a7-bc02-4f6d-8e25-3aa330dccb83",
        "codigo": "5.04",
        "descripcion": "Formaleta metálica (alquiler m²-mes)",
        "proyectado": 1600,
        "proyectado_val": 47766.4,
        "asignado": 1600,
        "asignado_val": 47766.4
      },
      {
        "id": "9ce71d01-2411-4a5d-9c37-e00e2aa8e857",
        "codigo": "5.05",
        "descripcion": "Casetón / aligerante de placa",
        "proyectado": 4200,
        "proyectado_val": 55062,
        "asignado": 4200,
        "asignado_val": 55062
      },
      {
        "id": "1e53c1f7-f566-4e9c-b2f0-4a88e5eb56ac",
        "codigo": "5.06",
        "descripcion": "Vibrador de concreto de inmersión",
        "proyectado": 110,
        "proyectado_val": 8349,
        "asignado": 110,
        "asignado_val": 8349
      },
      {
        "id": "3f5e7389-82d2-44d1-b717-61f374fad242",
        "codigo": "5.07",
        "descripcion": "Bombeo de concreto (hora-equipo)",
        "proyectado": 180,
        "proyectado_val": 78163.2,
        "asignado": 180,
        "asignado_val": 78163.2
      },
      {
        "id": "46dcad5b-83aa-4fd5-bb6c-57b4a5442c18",
        "codigo": "5.08",
        "descripcion": "Taladro industrial + cortadora / pulidora",
        "proyectado": 90,
        "proyectado_val": 7452,
        "asignado": 90,
        "asignado_val": 7452
      },
      {
        "id": "472b272d-6d19-4a17-9890-cb154326846d",
        "codigo": "6",
        "descripcion": "E-06 · MAMPOSTERÍA Y CERRAMIENTOS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "3a04a982-debf-4106-ac19-a1b03fc2eecb",
        "codigo": "6.01",
        "descripcion": "Cuadrilla de mampostería",
        "proyectado": 160,
        "proyectado_val": 78936,
        "asignado": 160,
        "asignado_val": 78936
      },
      {
        "id": "98e13356-38aa-413e-838e-393f6e206fef",
        "codigo": "6.02",
        "descripcion": "Ladrillo tolete estructural",
        "proyectado": 185000,
        "proyectado_val": 242535,
        "asignado": 185000,
        "asignado_val": 242535
      },
      {
        "id": "93ceffe5-5b5e-4b25-8d00-55c82ffe4b63",
        "codigo": "6.03",
        "descripcion": "Mortero de pega (cemento + arena)",
        "proyectado": 220,
        "proyectado_val": 103224,
        "asignado": 220,
        "asignado_val": 103224
      },
      {
        "id": "85b2c3f7-8899-4a0d-9fd5-861b44854bdf",
        "codigo": "6.04",
        "descripcion": "Taladro percutor para mampostería",
        "proyectado": 60,
        "proyectado_val": 3726,
        "asignado": 60,
        "asignado_val": 3726
      },
      {
        "id": "cd800050-5c41-4db0-a171-b4de983c38d4",
        "codigo": "7",
        "descripcion": "E-07 · PAÑETES, REVOQUES Y CIELOS RASOS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "ef902ab7-83f9-4bf9-b492-f3735e08e90c",
        "codigo": "7.01",
        "descripcion": "Cuadrilla de pañete y revoque",
        "proyectado": 150,
        "proyectado_val": 74002.5,
        "asignado": 150,
        "asignado_val": 74002.5
      },
      {
        "id": "19854213-0b5f-45be-bf21-22978bab8c30",
        "codigo": "7.02",
        "descripcion": "Cuadrilla de cielo raso en drywall",
        "proyectado": 90,
        "proyectado_val": 45747,
        "asignado": 90,
        "asignado_val": 45747
      },
      {
        "id": "e92117fb-e7b7-44df-9e3b-2d95177c122c",
        "codigo": "7.03",
        "descripcion": "Mortero de pañete (cemento + arena)",
        "proyectado": 180,
        "proyectado_val": 84456,
        "asignado": 180,
        "asignado_val": 84456
      },
      {
        "id": "cbccbdfe-ce73-47e3-91be-06df96767995",
        "codigo": "7.04",
        "descripcion": "Lámina drywall + estructura + masilla",
        "proyectado": 2400,
        "proyectado_val": 127953.6,
        "asignado": 2400,
        "asignado_val": 127953.6
      },
      {
        "id": "a7ad67b2-6046-4d3c-a91f-42e763090624",
        "codigo": "7.05",
        "descripcion": "Mezcladora de mortero",
        "proyectado": 90,
        "proyectado_val": 4968,
        "asignado": 90,
        "asignado_val": 4968
      },
      {
        "id": "7f14196f-6fb1-4c3e-bd7f-552ac33f2a11",
        "codigo": "8",
        "descripcion": "E-08 · INSTALACIONES HIDROSANITARIAS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "746864d6-865e-4b6d-93c5-1c16c2e7c360",
        "codigo": "8.01",
        "descripcion": "Cuadrilla de plomería",
        "proyectado": 90,
        "proyectado_val": 45747,
        "asignado": 90,
        "asignado_val": 45747
      },
      {
        "id": "c7d1faf9-b978-4ead-b441-822c457e5de7",
        "codigo": "8.02",
        "descripcion": "Tubería PVC presión y sanitaria + accesorios",
        "proyectado": 1,
        "proyectado_val": 107640,
        "asignado": 1,
        "asignado_val": 107640
      },
      {
        "id": "12072283-4af8-4cf8-a099-d39789cc1064",
        "codigo": "8.03",
        "descripcion": "Aparatos sanitarios y grifería",
        "proyectado": 1,
        "proyectado_val": 86986,
        "asignado": 1,
        "asignado_val": 86986
      },
      {
        "id": "c4f10d3b-7d66-4f95-b4c2-1bab9f26a9bc",
        "codigo": "8.04",
        "descripcion": "Roto-martillo perforación instalaciones",
        "proyectado": 40,
        "proyectado_val": 2760,
        "asignado": 40,
        "asignado_val": 2760
      },
      {
        "id": "a7fad17d-1c7d-4809-9600-f1372440896a",
        "codigo": "9",
        "descripcion": "E-09 · RED DE GAS DOMICILIARIO",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "3ceace1f-faa3-4c8e-b8de-9bf293849c9e",
        "codigo": "9.01",
        "descripcion": "Cuadrilla de instalación de red de gas",
        "proyectado": 35,
        "proyectado_val": 17790.5,
        "asignado": 35,
        "asignado_val": 17790.5
      },
      {
        "id": "63d71f5b-2bb3-47f0-88d4-5ba48cade355",
        "codigo": "9.02",
        "descripcion": "Tubería de gas, reguladores y accesorios",
        "proyectado": 1,
        "proyectado_val": 63480,
        "asignado": 1,
        "asignado_val": 63480
      },
      {
        "id": "4912459b-401c-456a-ae2a-e15f8b04dccf",
        "codigo": "9.03",
        "descripcion": "Subcontrato: Certificación y pruebas de red de gas (organismo acreditado)",
        "proyectado": 1,
        "proyectado_val": 15456,
        "asignado": 1,
        "asignado_val": 15456
      },
      {
        "id": "6b562ebb-531e-4b22-937d-9f488ad3d0fc",
        "codigo": "10",
        "descripcion": "E-10 · INSTALACIONES ELÉCTRICAS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "4295d5eb-df18-4dde-a171-1f60cfd9a3c7",
        "codigo": "10.01",
        "descripcion": "Cuadrilla eléctrica",
        "proyectado": 100,
        "proyectado_val": 52325,
        "asignado": 100,
        "asignado_val": 52325
      },
      {
        "id": "16c84f8d-8e6f-4e4e-829b-310151012e3b",
        "codigo": "10.02",
        "descripcion": "Cableado, tubería EMT y accesorios",
        "proyectado": 1,
        "proyectado_val": 131100,
        "asignado": 1,
        "asignado_val": 131100
      },
      {
        "id": "57ca2f97-c007-4b8f-9c8f-19cf1471c81d",
        "codigo": "10.03",
        "descripcion": "Tableros, protecciones y salidas",
        "proyectado": 1,
        "proyectado_val": 67344,
        "asignado": 1,
        "asignado_val": 67344
      },
      {
        "id": "b35a1632-0d59-4cc8-b098-1f734e6c7697",
        "codigo": "10.04",
        "descripcion": "Taladro perforador para instalaciones eléctricas",
        "proyectado": 45,
        "proyectado_val": 3105,
        "asignado": 45,
        "asignado_val": 3105
      },
      {
        "id": "b3b6ebac-2a6b-42cf-b874-e58fca1d18a4",
        "codigo": "10.05",
        "descripcion": "Subcontrato: Red contra incendios y detección (llave en mano)",
        "proyectado": 1,
        "proyectado_val": 79856,
        "asignado": 1,
        "asignado_val": 79856
      },
      {
        "id": "85ddc43a-ae9c-49b4-818b-bcfae8534bbe",
        "codigo": "11",
        "descripcion": "E-11 · CORRIENTES DÉBILES: CITOFONÍA, CCTV Y DATOS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "95439d79-f5ba-4c64-9c48-ae40251b9242",
        "codigo": "11.01",
        "descripcion": "Coordinación técnica de instalaciones especiales",
        "proyectado": 4,
        "proyectado_val": 28704,
        "asignado": 4,
        "asignado_val": 28704
      },
      {
        "id": "8893c385-560d-4187-b10b-434ea84f2590",
        "codigo": "11.02",
        "descripcion": "Subcontrato: Citofonía y control de acceso (llave en mano)",
        "proyectado": 1,
        "proyectado_val": 74704,
        "asignado": 1,
        "asignado_val": 74704
      },
      {
        "id": "b2697476-e3c6-47d3-bceb-aed344419e06",
        "codigo": "11.03",
        "descripcion": "Subcontrato: CCTV y cableado estructurado (llave en mano)",
        "proyectado": 1,
        "proyectado_val": 92736,
        "asignado": 1,
        "asignado_val": 92736
      },
      {
        "id": "5e5969b5-a225-4e3e-8f7c-2da14c130971",
        "codigo": "12",
        "descripcion": "E-12 · VENTILACIÓN MECÁNICA Y EXTRACCIÓN",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "a762e267-1b76-469a-9b7e-d498b4237956",
        "codigo": "12.01",
        "descripcion": "Ductos, rejillas y accesorios",
        "proyectado": 1,
        "proyectado_val": 33120,
        "asignado": 1,
        "asignado_val": 33120
      },
      {
        "id": "ff4469dd-9236-43a9-ab7d-a287390e749f",
        "codigo": "12.02",
        "descripcion": "Subcontrato: Ventilación de sótanos y extracción de baños (llave en mano)",
        "proyectado": 1,
        "proyectado_val": 123648,
        "asignado": 1,
        "asignado_val": 123648
      },
      {
        "id": "bac8a2db-d73b-43ec-a60f-b2389deeb9df",
        "codigo": "13",
        "descripcion": "E-13 · EQUIPOS HIDRÁULICOS: BOMBEO, TANQUES Y PRESIÓN",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "40a0531a-f2ed-4f73-8ba7-dce82578b9b3",
        "codigo": "13.01",
        "descripcion": "Cuadrilla de montaje hidráulico",
        "proyectado": 25,
        "proyectado_val": 12707.5,
        "asignado": 25,
        "asignado_val": 12707.5
      },
      {
        "id": "ca47ba44-8337-4cfb-89db-a39d52929ab0",
        "codigo": "13.02",
        "descripcion": "Tanques de almacenamiento de agua potable",
        "proyectado": 2,
        "proyectado_val": 49680,
        "asignado": 2,
        "asignado_val": 49680
      },
      {
        "id": "b3130332-b431-4cda-a70b-38c057899753",
        "codigo": "13.03",
        "descripcion": "Subcontrato: Equipo de presión constante y bombeo (suministro e instalación)",
        "proyectado": 1,
        "proyectado_val": 113344,
        "asignado": 1,
        "asignado_val": 113344
      },
      {
        "id": "08149c6a-2233-413e-b469-0d3b539fd4df",
        "codigo": "14",
        "descripcion": "E-14 · ACABADOS (PISOS, ENCHAPES Y PINTURA)",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "7f1ff4d0-5e3d-476d-97ca-7b8398f8aeaf",
        "codigo": "14.01",
        "descripcion": "Cuadrilla de enchapes y pisos",
        "proyectado": 140,
        "proyectado_val": 69069,
        "asignado": 140,
        "asignado_val": 69069
      },
      {
        "id": "c65c33bd-6327-476c-809f-92a54a07e358",
        "codigo": "14.02",
        "descripcion": "Cuadrilla de estuco y pintura",
        "proyectado": 120,
        "proyectado_val": 57408,
        "asignado": 120,
        "asignado_val": 57408
      },
      {
        "id": "9097f23a-aa82-4361-a965-93e5363f9f20",
        "codigo": "14.03",
        "descripcion": "Cerámica / porcelanato",
        "proyectado": 3200,
        "proyectado_val": 305292.8,
        "asignado": 3200,
        "asignado_val": 305292.8
      },
      {
        "id": "cd685724-587a-4bf4-a3e4-3a2bd56823a0",
        "codigo": "14.04",
        "descripcion": "Estuco, pintura y vinilos",
        "proyectado": 1,
        "proyectado_val": 58926,
        "asignado": 1,
        "asignado_val": 58926
      },
      {
        "id": "e495f910-3160-4d2a-8b3b-61d1819fe7c8",
        "codigo": "14.05",
        "descripcion": "Enchape de baños y cocinas",
        "proyectado": 1400,
        "proyectado_val": 108031,
        "asignado": 1400,
        "asignado_val": 108031
      },
      {
        "id": "47d76eba-ccb6-4688-93c0-cc0fe199951d",
        "codigo": "14.06",
        "descripcion": "Subcontrato: Suministro e instalación de ascensores",
        "proyectado": 2,
        "proyectado_val": 463680,
        "asignado": 2,
        "asignado_val": 463680
      },
      {
        "id": "23724c23-6fb2-4e83-9d19-a70faa2e91f1",
        "codigo": "15",
        "descripcion": "E-15 · CARPINTERÍA, VENTANERÍA Y CUBIERTA",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "02280304-aaf0-4f86-921a-ec964b7d3c5e",
        "codigo": "15.01",
        "descripcion": "Cuadrilla de instalación carpintería / ventanería",
        "proyectado": 80,
        "proyectado_val": 40664,
        "asignado": 80,
        "asignado_val": 40664
      },
      {
        "id": "a9840d20-ed45-4c35-921a-2daf1a396d46",
        "codigo": "15.02",
        "descripcion": "Puertas y carpintería en madera",
        "proyectado": 220,
        "proyectado_val": 148156.8,
        "asignado": 220,
        "asignado_val": 148156.8
      },
      {
        "id": "1f451ab6-d5b4-4dd5-9a7d-b6bbced3ad56",
        "codigo": "15.03",
        "descripcion": "Ventanería en aluminio + vidrio",
        "proyectado": 780,
        "proyectado_val": 213396.3,
        "asignado": 780,
        "asignado_val": 213396.3
      },
      {
        "id": "3ae165a3-bb02-4bdd-a651-71245158c958",
        "codigo": "15.04",
        "descripcion": "Impermeabilización y cubierta",
        "proyectado": 620,
        "proyectado_val": 72726,
        "asignado": 620,
        "asignado_val": 72726
      },
      {
        "id": "5c01a607-2fc1-4c74-8055-fef009c12cc7",
        "codigo": "15.05",
        "descripcion": "Taladro / atornillador y pulidora (carpintería)",
        "proyectado": 35,
        "proyectado_val": 2656.5,
        "asignado": 35,
        "asignado_val": 2656.5
      },
      {
        "id": "40b554a9-c200-46d9-8350-57dab0485f7a",
        "codigo": "15.06",
        "descripcion": "Subcontrato: Muro cortina / fachada flotante (llave en mano)",
        "proyectado": 320,
        "proyectado_val": 177744,
        "asignado": 320,
        "asignado_val": 177744
      },
      {
        "id": "dfb77e08-5575-46df-a108-f0898de8b3a8",
        "codigo": "16",
        "descripcion": "E-16 · MUEBLES FIJOS: COCINAS INTEGRALES Y CLOSETS",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "6f00f5f3-7c51-4bde-a44e-bb769ce2dae4",
        "codigo": "16.01",
        "descripcion": "Subcontrato: Cocinas integrales (suministro e instalación)",
        "proyectado": 40,
        "proyectado_val": 359720,
        "asignado": 40,
        "asignado_val": 359720
      },
      {
        "id": "f3b8cacb-7458-4107-b1da-4a9e435eb871",
        "codigo": "16.02",
        "descripcion": "Subcontrato: Closets y muebles de baño (suministro e instalación)",
        "proyectado": 40,
        "proyectado_val": 222180,
        "asignado": 40,
        "asignado_val": 222180
      },
      {
        "id": "4a16425e-9b6e-445b-a6c2-4c4e5f5b53d8",
        "codigo": "17",
        "descripcion": "E-17 · URBANISMO, EXTERIORES Y PAISAJISMO",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "7e38b223-cfa3-4e5b-b640-463a5df4f676",
        "codigo": "17.01",
        "descripcion": "Cuadrilla de andenes, sardineles y exteriores",
        "proyectado": 70,
        "proyectado_val": 34534.5,
        "asignado": 70,
        "asignado_val": 34534.5
      },
      {
        "id": "9f4e9248-2527-4961-ac4a-5ad2e47627ac",
        "codigo": "17.02",
        "descripcion": "Concreto para andenes y sardineles",
        "proyectado": 90,
        "proyectado_val": 64584,
        "asignado": 90,
        "asignado_val": 64584
      },
      {
        "id": "e6ab7a93-e3be-4f17-9600-f3fe7c8ad7d1",
        "codigo": "17.03",
        "descripcion": "Adoquín, grama y jardinería",
        "proyectado": 850,
        "proyectado_val": 73938.1,
        "asignado": 850,
        "asignado_val": 73938.1
      },
      {
        "id": "de64674d-3e3f-4057-a2d4-0ca671c7af45",
        "codigo": "17.04",
        "descripcion": "Minicargador / compactador para exteriores",
        "proyectado": 25,
        "proyectado_val": 6210,
        "asignado": 25,
        "asignado_val": 6210
      },
      {
        "id": "75801916-adff-40fe-85b6-3f8f204bec40",
        "codigo": "17.05",
        "descripcion": "Subcontrato: Portería, cerramiento definitivo y obras exteriores",
        "proyectado": 1,
        "proyectado_val": 103155,
        "asignado": 1,
        "asignado_val": 103155
      },
      {
        "id": "156fe93a-24af-4b9d-b9ee-fb16ad32ca08",
        "codigo": "18",
        "descripcion": "E-18 · SEGURIDAD INDUSTRIAL (SST), ANDAMIOS Y EQUIPOS DE ALTURA",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "2334834f-1277-40b1-9d85-d6da1dbca3b2",
        "codigo": "18.01",
        "descripcion": "Coordinador SST / seguridad industrial",
        "proyectado": 10,
        "proyectado_val": 67275,
        "asignado": 10,
        "asignado_val": 67275
      },
      {
        "id": "b8cb9c8e-5eae-474f-b612-d97bc12fb51f",
        "codigo": "18.02",
        "descripcion": "Dotación, EPP y señalización de obra",
        "proyectado": 1,
        "proyectado_val": 44160,
        "asignado": 1,
        "asignado_val": 44160
      },
      {
        "id": "06bdd1b2-990a-4bdd-85a6-d7ef4aebde00",
        "codigo": "18.03",
        "descripcion": "Alquiler andamio certificado multidireccional (torre-mes)",
        "proyectado": 60,
        "proyectado_val": 51336,
        "asignado": 60,
        "asignado_val": 51336
      },
      {
        "id": "d867f919-f592-4ed0-a19c-b7cb6aeb7f01",
        "codigo": "18.04",
        "descripcion": "Alquiler malacate / montacargas de obra",
        "proyectado": 8,
        "proyectado_val": 56451.2,
        "asignado": 8,
        "asignado_val": 56451.2
      },
      {
        "id": "bb7317ed-c767-472d-85ae-4ab26603fc80",
        "codigo": "19",
        "descripcion": "E-19 · ASEO GENERAL, RESANE Y ENTREGA",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "f747a3c5-415a-4280-b86b-1925df74b1c9",
        "codigo": "19.01",
        "descripcion": "Cuadrilla de aseo general y resane final",
        "proyectado": 60,
        "proyectado_val": 26910,
        "asignado": 60,
        "asignado_val": 26910
      },
      {
        "id": "6c27dc75-5b11-4e9a-bde5-e0285f830dc0",
        "codigo": "19.02",
        "descripcion": "Insumos de aseo, resane y protección",
        "proyectado": 1,
        "proyectado_val": 19320,
        "asignado": 1,
        "asignado_val": 19320
      },
      {
        "id": "60981360-43c4-4102-b0b8-a660c67d41c8",
        "codigo": "19.03",
        "descripcion": "Retiro de escombros y disposición final",
        "proyectado": 60,
        "proyectado_val": 15469.8,
        "asignado": 60,
        "asignado_val": 15469.8
      },
      {
        "id": "8df3ffa4-f7f6-4bbe-a5f0-61fa3d0b73aa",
        "codigo": "20",
        "descripcion": "E-20 · MOVILIZACIÓN, TRANSPORTE Y VIAJES",
        "proyectado": 0,
        "proyectado_val": 0,
        "asignado": 0,
        "asignado_val": 0
      },
      {
        "id": "b6b4a46e-8d43-478c-b96b-5aab5b6f0535",
        "codigo": "20.01",
        "descripcion": "Transporte de materiales a obra (fletes)",
        "proyectado": 140,
        "proyectado_val": 41795.6,
        "asignado": 140,
        "asignado_val": 41795.6
      },
      {
        "id": "bccca277-4c81-4c26-b8d7-208159dee663",
        "codigo": "20.02",
        "descripcion": "Movilización de equipos y grúa torre",
        "proyectado": 1,
        "proyectado_val": 92276,
        "asignado": 1,
        "asignado_val": 92276
      },
      {
        "id": "f1176c95-6985-40a9-8901-037ae0969860",
        "codigo": "20.03",
        "descripcion": "Viáticos y alojamiento personal foráneo",
        "proyectado": 1200,
        "proyectado_val": 103155,
        "asignado": 1200,
        "asignado_val": 103155
      },
      {
        "id": "8976c56d-b9e0-4cc1-888b-beebed4ceac6",
        "codigo": "20.04",
        "descripcion": "Transporte y viajes del personal",
        "proyectado": 10,
        "proyectado_val": 55545,
        "asignado": 10,
        "asignado_val": 55545
      }
    ],
    "situacion": "Activo",
    "creado_por": "Administrador Contable",
    "creado_en": "2026-07-12T09:00:00.000Z"
  }
]
