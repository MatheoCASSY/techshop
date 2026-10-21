import type { Prisma } from '@prisma/client';

/** Recalcule la note moyenne dénormalisée d'un produit (à appeler dans la transaction de l'avis). */
export async function refreshProductRating(tx: Prisma.TransactionClient, productId: string) {
  const stats = await tx.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: true,
  });
  await tx.product.update({
    where: { id: productId },
    data: { ratingAvg: stats._avg.rating, reviewCount: stats._count },
  });
}
