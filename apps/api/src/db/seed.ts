import { fakerFR as faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import type { CategorySlug } from '@techshop/shared';
import { hashPassword } from '../lib/password.js';

const prisma = new PrismaClient();

// Graine fixe : le seed produit toujours les mêmes données (démos et tests reproductibles)
faker.seed(42);

const CATEGORIES: Record<CategorySlug, string> = {
  laptops: 'Ordinateurs portables',
  smartphones: 'Smartphones',
  audio: 'Audio',
  peripherals: 'Périphériques',
  components: 'Composants',
  accessories: 'Accessoires',
};

type SeedProduct = [name: string, priceEuros: number, description: string];

const PRODUCTS: Record<CategorySlug, SeedProduct[]> = {
  laptops: [
    [
      'UltraBook Air 14',
      1099,
      'Ultraportable 14" de 1,2 kg, 16 Go de RAM, SSD 512 Go et 18 h d\'autonomie.',
    ],
    [
      'ProBook Studio 16',
      2299,
      'Écran 16" OLED 120 Hz, 32 Go de RAM et carte graphique dédiée pour la création.',
    ],
    [
      'Gaming Blade 15',
      1799,
      'PC portable gaming 15" 240 Hz, RTX de dernière génération et clavier RGB.',
    ],
    ['Chromebook Flex 13', 449, 'Convertible 13" tactile avec stylet, idéal pour les études.'],
    [
      'WorkStation X17',
      3199,
      'Station de travail mobile 17", 64 Go de RAM ECC, certifiée pour la CAO.',
    ],
    ['NoteBook Essential 15', 599, 'Portable 15" polyvalent pour la bureautique et le multimédia.'],
  ],
  smartphones: [
    [
      'Pixelite 9 Pro',
      999,
      'Photo de nuit bluffante, écran 6,7" LTPO et sept ans de mises à jour.',
    ],
    ['Nova S25', 849, 'Smartphone compact 6,1" avec charge rapide 65 W.'],
    ['Nova S25 Ultra', 1349, 'Zoom optique x10, stylet intégré et écran 6,8" QHD+.'],
    ['FoldMax 3', 1799, 'Smartphone pliable avec un écran intérieur de 7,6".'],
    ['Essentiel A16', 229, 'Le meilleur rapport qualité-prix : 6,5", 5G et 2 jours d\'autonomie.'],
    ['Rugged R7', 499, 'Smartphone durci IP69K, résistant aux chutes de 2 m.'],
  ],
  audio: [
    ['SoundPods Pro 3', 279, 'Écouteurs sans fil à réduction de bruit active adaptative.'],
    ['StudioMax Headphones', 399, "Casque circum-auriculaire Hi-Res, 40 h d'autonomie."],
    ['BoomBox Go', 129, 'Enceinte Bluetooth étanche, 20 h de musique.'],
    ['HomeSound Bar 5.1', 549, 'Barre de son Dolby Atmos avec caisson sans fil.'],
    ['PodCast Mic USB', 149, 'Micro à condensateur USB-C pour streaming et podcast.'],
    ['DAC Portable D1', 99, 'DAC/ampli de poche 32 bits pour écouteurs filaires.'],
  ],
  peripherals: [
    ['MechKey TKL', 139, 'Clavier mécanique sans pavé numérique, switchs remplaçables à chaud.'],
    ['ErgoMouse Vertical', 79, 'Souris verticale ergonomique qui soulage le poignet.'],
    ['Écran 27" 4K IPS', 449, 'Moniteur 27" 4K, 99 % sRGB, USB-C 90 W.'],
    ['Écran 34" UltraWide', 699, 'Moniteur incurvé 34" 3440×1440 à 165 Hz.'],
    ['Webcam 4K Stream', 169, 'Webcam 4K HDR avec autofocus et micro stéréo.'],
    ['Tablette graphique M', 249, 'Tablette à stylet 8192 niveaux de pression.'],
  ],
  components: [
    ['SSD NVMe 2 To Gen4', 159, "Jusqu'à 7 000 Mo/s en lecture, dissipateur inclus."],
    ['Kit RAM DDR5 32 Go', 119, '2 × 16 Go DDR5-6000 CL30, profils EXPO/XMP.'],
    ['Carte graphique RX 9070', 649, 'Pour jouer en 1440p au maximum des réglages.'],
    ['Processeur Ryzen 7 9800X3D', 479, '8 cœurs avec 3D V-Cache, le roi du jeu vidéo.'],
    ['Alimentation 850 W Gold', 129, 'Alimentation modulaire 80+ Gold, ATX 3.1.'],
    ['Boîtier Airflow Mid', 99, 'Boîtier moyen tour à façade mesh avec 3 ventilateurs ARGB.'],
  ],
  accessories: [
    ['Hub USB-C 8-en-1', 59, 'HDMI 4K, Ethernet, lecteur SD et charge 100 W.'],
    ['Chargeur GaN 100 W', 69, 'Chargeur compact 3 ports pour portable et smartphone.'],
    ['Sac à dos Tech 17"', 89, 'Sac imperméable avec compartiment rembourré pour portable.'],
    ['Support portable alu', 39, 'Support réglable en aluminium pour une meilleure posture.'],
    ['Câble USB-C tressé 2 m', 19, 'Câble USB4 40 Gb/s, 240 W.'],
    ['Batterie externe 20 000 mAh', 49, 'Power bank 65 W capable de recharger un portable.'],
  ],
};

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('SEED_ADMIN_PASSWORD est requis (voir .env.example)');
  }

  // --if-empty : utilisé au démarrage du conteneur, pour ne jamais écraser une base existante
  if (process.argv.includes('--if-empty') && (await prisma.product.count()) > 0) {
    console.log('Base déjà peuplée, seed ignoré.');
    return;
  }

  // Ordre inverse des dépendances pour respecter les clés étrangères
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: 'admin@techshop.local',
      name: 'Admin',
      role: 'admin',
      passwordHash: await hashPassword(adminPassword),
    },
  });

  // Clients fictifs, auteurs des avis
  const customerHash = await hashPassword('demo-password');
  const customers = await Promise.all(
    Array.from({ length: 8 }, () =>
      prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          name: faker.person.fullName(),
          passwordHash: customerHash,
        },
      }),
    ),
  );

  let productCount = 0;
  for (const [slug, name] of Object.entries(CATEGORIES) as [CategorySlug, string][]) {
    const category = await prisma.category.create({ data: { slug, name } });

    for (const [productName, priceEuros, description] of PRODUCTS[slug]) {
      const productSlug = slugify(productName);
      const product = await prisma.product.create({
        data: {
          slug: productSlug,
          name: productName,
          description,
          priceCents: priceEuros * 100,
          stock: faker.number.int({ min: 0, max: 60 }),
          imageUrl: `https://picsum.photos/seed/${productSlug}/640/480`,
          categoryId: category.id,
          createdAt: faker.date.recent({ days: 120 }),
        },
      });
      productCount++;

      const reviewers = faker.helpers.arrayElements(customers, { min: 0, max: 5 });
      for (const reviewer of reviewers) {
        await prisma.review.create({
          data: {
            rating: faker.number.int({ min: 2, max: 5 }),
            comment: faker.lorem.sentences({ min: 1, max: 3 }),
            userId: reviewer.id,
            productId: product.id,
          },
        });
      }
    }
  }

  console.log(`Seed terminé : ${productCount} produits, ${customers.length + 1} utilisateurs.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
