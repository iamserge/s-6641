/// <reference lib="es2015" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logInfo, logError } from "./utils.ts";
import { supabaseUrl, supabaseServiceKey } from "./constants.ts";
import { 
  Brand, 
  Ingredient, 
  Product, 
  ProductDupe,
  Resource,
  Database
} from "./types.ts";

// Initialize Supabase Client
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Brand-related database operations
 */
export async function getBrandByName(brandName: string) {
  return await supabase
    .from("brands")
    .select("id, name, slug, price_range, cruelty_free, vegan, country_of_origin, sustainable_packaging, parent_company")
    .eq("name", brandName)
    .maybeSingle();
}

export async function getBrandById(brandId: string) {
  return await supabase
    .from("brands")
    .select("*")
    .eq("id", brandId)
    .single();
}

export async function insertBrand(brandData: Partial<Brand>) {
  return await supabase
    .from("brands")
    .insert(brandData)
    .select()
    .single();
}

export async function updateBrand(brandId: string, brandData: Partial<Brand>) {
  return await supabase
    .from("brands")
    .update(brandData)
    .eq("id", brandId)
    .select()
    .single();
}

/**
 * Ingredient-related database operations
 */
export async function getIngredientByName(ingredientName: string) {
  return await supabase
    .from("ingredients")
    .select("*")
    .eq("name", ingredientName.trim())
    .maybeSingle();
}

export async function getIngredientById(ingredientId: string) {
  return await supabase
    .from("ingredients")
    .select("*")
    .eq("id", ingredientId)
    .single();
}

export async function insertIngredient(ingredientData: Partial<Ingredient>) {
  return await supabase
    .from("ingredients")
    .insert(ingredientData)
    .select()
    .single();
}

export async function updateIngredient(ingredientId: string, ingredientData: Partial<Ingredient>) {
  return await supabase
    .from("ingredients")
    .update(ingredientData)
    .eq("id", ingredientId)
    .select()
    .single();
}

/**
 * Product-related database operations
 */
export async function getProductByNameAndBrand(name: string, brand: string) {
  return await supabase
    .from("products")
    .select("*")
    .eq("name", name)
    .eq("brand", brand)
    .maybeSingle();
}

export async function getProductBySlug(slug: string) {
  return await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();
}

export async function getProductById(productId: string) {
  return await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
}

export async function insertProduct(productData: Partial<Product>) {
  return await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();
}

export async function updateProduct(productId: string, productData: Partial<Product>) {
  return await supabase
    .from("products")
    .update(productData)
    .eq("id", productId)
    .select()
    .single();
}

/**
 * Product Dupes related database operations
 */
export async function getProductDupesByOriginalId(originalProductId: string) {
  return await supabase
    .from("product_dupes")
    .select(`
      *,
      dupe_product:products!product_dupes_dupe_product_id_fkey (*)
    `)
    .eq("original_product_id", originalProductId);
}

export async function insertProductDupe(dupeData: ProductDupe) {
  return await supabase
    .from("product_dupes")
    .insert(dupeData)
    .select()
    .single();
}

/**
 * Product Ingredients junction table operations
 */
export async function linkIngredientToProduct(productId: string, ingredientId: string, isKey: boolean = true) {
  try {
    const { error } = await supabase
      .from("product_ingredients")
      .insert({
        product_id: productId,
        ingredient_id: ingredientId,
        is_key_ingredient: isKey
      });
    
    if (error && error.code !== "23505") { // Ignore unique constraint violations
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    logError(`Failed to link ingredient to product:`, error);
    throw error;
  }
}

/**
 * Link ingredient to dupe product
 */
export async function linkIngredientToDupe(dupeId: string, ingredientId: string, isKey: boolean = true) {
  try {
    const { error } = await supabase
      .from("product_ingredients")
      .insert({
        product_id: dupeId, // Note: dupes are stored in the products table, so we use the same table
        ingredient_id: ingredientId,
        is_key_ingredient: isKey
      });
    
    if (error && error.code !== "23505") { // Ignore unique constraint violations
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    logError(`Failed to link ingredient to dupe:`, error);
    throw error;
  }
}

/**
 * Resource-related database operations
 */
export async function insertResource(resourceData: Partial<Resource>) {
  return await supabase
    .from("resources")
    .insert(resourceData);
}

export async function insertResources(resourcesData: Partial<Resource>[]) {
  return await supabase
    .from("resources")
    .insert(resourcesData);
}

/**
 * Image storage operations
 */
export async function uploadImage(bucket: string, path: string, file: Blob, contentType: string) {
  return await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType });
}

export function getPublicUrl(bucket: string, path: string) {
  // In newer Supabase JS client versions, this might return a different structure
  const result = supabase.storage.from(bucket).getPublicUrl(path);
  // Add some debugging to see the actual structure
  console.log("getPublicUrl result:", JSON.stringify(result));
  return result;
}

/**
 * Merchants and Offers operations
 */
export async function getMerchantByDomain(domain: string) {
  return await supabase
    .from("merchants")
    .select("*")
    .eq("domain", domain)
    .maybeSingle();
}

export async function insertMerchant(merchantData: {
  name: string;
  domain?: string;
  logo_url?: string;
}) {
  return await supabase
    .from("merchants")
    .insert(merchantData)
    .select()
    .single();
}

export async function insertOffer(offerData: {
  merchant_id: string;
  title?: string;
  price: number;
  list_price?: number;
  currency?: string;
  shipping?: string;
  condition?: string;
  availability?: string;
  link: string;
}) {
  return await supabase
    .from("offers")
    .insert(offerData)
    .select()
    .single();
}

export async function linkOfferToProduct(productId: string, offerId: string, isBestPrice: boolean = false) {
  return await supabase
    .from("product_offers")
    .insert({
      product_id: productId,
      offer_id: offerId,
      is_best_price: isBestPrice
    });
}


export async function storeProductOffers(productId: string, offers: any[]): Promise<void> {
  try {
    logInfo(`Storing ${offers.length} offers for product ${productId}`);
    
    for (const offer of offers) {
      // 1. Check if merchant exists or create it
      let merchantId: string;
      const { data: existingMerchant, error: merchantFindError } = await getMerchantByDomain(offer.domain);
      
      if (merchantFindError && merchantFindError.code !== "PGRST116") {
        logError(`Error checking for merchant ${offer.merchant}:`, merchantFindError);
        continue; // Skip this offer on error
      }
      
      if (existingMerchant) {
        merchantId = existingMerchant.id;
      } else {
        // Create new merchant
        const { data: newMerchant, error: merchantInsertError } = await insertMerchant({
          name: offer.merchant,
          domain: offer.domain,
        });
        
        if (merchantInsertError) {
          logError(`Error creating merchant ${offer.merchant}:`, merchantInsertError);
          continue; // Skip this offer on error
        }
        
        merchantId = newMerchant.id;
      }
      
      // 2. Insert the offer
      const { data: newOffer, error: offerInsertError } = await insertOffer({
        merchant_id: merchantId,
        title: offer.title,
        price: parseFloat(offer.price) || 0, // Ensure price is a number
        list_price: offer.list_price ? parseFloat(offer.list_price) : undefined,
        currency: offer.currency,
        shipping: offer.shipping,
        condition: offer.condition,
        availability: offer.availability,
        link: offer.link
      });
      
      if (offerInsertError) {
        logError(`Error creating offer for ${offer.merchant}:`, offerInsertError);
        continue; // Skip linking on error
      }
      
      // 3. Link offer to product
      const { error: linkError } = await linkOfferToProduct(productId, newOffer.id);
      
      if (linkError) {
        logError(`Error linking offer to product:`, linkError);
        // Continue to next offer even if linking fails
      }
    }
    
    logInfo(`Successfully processed offers for product ${productId}`);
  } catch (error) {
    logError(`Error in storeProductOffers:`, error);
    // Don't throw to avoid interrupting the main process
  }
}

/**
 * Review-related database operations
 */
export async function insertReview(reviewData: {
  product_id: string;
  rating: number;
  author_name?: string;
  author_avatar?: string;
  review_text: string;
  source?: string;
  source_url?: string;
  verified_purchase?: boolean;
}) {
  return await supabase
    .from("reviews")
    .insert(reviewData)
    .select()
    .single();
}

export async function getReviewsByProductId(productId: string) {
  return await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
}

/**
 * Enhanced resource handling operations
 */
export async function insertEnhancedResource(resourceData: {
  title: string;
  url: string;
  type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article" | "Reddit";
  video_thumbnail?: string;
  video_duration?: string;
  author_name?: string;
  author_handle?: string;
  views_count?: number;
  likes_count?: number;
  embed_code?: string;
}):Promise<any> {
  return await supabase
    .from("resources")
    .insert(resourceData)
    .select()
    .single();
}

export async function linkResourceToProduct(productId: string, resourceId: string, isFeatured: boolean = false) {
  try {
    const { error } = await supabase
      .from("product_resources")
      .insert({
        product_id: productId,
        resource_id: resourceId,
        is_featured: isFeatured
      });
    
    if (error && error.code !== "23505") { // Ignore unique constraint violations
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    logError(`Failed to link resource to product:`, error);
    throw error;
  }
}

export async function getResourcesByProductId(productId: string) {
  return await supabase
    .from("product_resources")
    .select(`
      is_featured,
      resources:resource_id (*)
    `)
    .eq("product_id", productId);
}

/**
 * Store reviews and resources for a product
 */
export async function storeProductReviewsAndResources(
  productId: string, 
  reviews: any[], 
  rating: { averageRating: number, totalReviews: number, source: string },
  socialMedia: { instagram: any[], tiktok: any[], youtube: any[] },
  articles: any[]
): Promise<void> {
  try {
    logInfo(`Storing reviews and resources for product ${productId}`);
    
    // Store the aggregate product rating if available
    if (rating && rating.averageRating) {
      await supabase
        .from("products")
        .update({
          rating: rating.averageRating,
          rating_count: rating.totalReviews,
          rating_source: rating.source
        })
        .eq("id", productId);
    }
    
    // Store individual reviews
    if (reviews && reviews.length > 0) {
      for (const review of reviews) {
        try {
          await insertReview({
            product_id: productId,
            rating: review.rating,
            author_name: review.author,
            author_avatar: review.avatar,
            review_text: review.text,
            source: review.source,
            source_url: review.sourceUrl,
            verified_purchase: review.verifiedPurchase
          });
        } catch (error) {
          logError(`Failed to insert review for ${productId}:`, error);
          // Continue with next review even if one fails
        }
      }
    }
    
    // Store social media resources
    const allResources: any[] = [];
    
    // Instagram
    if (socialMedia?.instagram && socialMedia.instagram.length > 0) {
      for (const post of socialMedia.instagram) {
        try {
          const { data: resource } = await insertEnhancedResource({
            title: `Instagram post by ${post.author}`,
            url: post.url,
            type: "Instagram",
            video_thumbnail: post.thumbnail,
            author_name: post.author,
            author_handle: post.authorHandle,
            views_count: post.views,
            likes_count: post.likes
          });
          
          if (resource) {
            await linkResourceToProduct(productId, resource.id, true);
            allResources.push(resource);
          }
        } catch (error) {
          logError(`Failed to insert Instagram resource:`, error);
        }
      }
    }
    
    // TikTok
    if (socialMedia?.tiktok && socialMedia.tiktok.length > 0) {
      for (const video of socialMedia.tiktok) {
        try {
          const { data: resource } = await insertEnhancedResource({
            title: `TikTok by ${video.author}`,
            url: video.url,
            type: "TikTok",
            video_thumbnail: video.thumbnail,
            author_name: video.author,
            author_handle: video.authorHandle,
            views_count: video.views,
            likes_count: video.likes,
            embed_code: video.embed
          });
          
          if (resource) {
            await linkResourceToProduct(productId, resource.id, true);
            allResources.push(resource);
          }
        } catch (error) {
          logError(`Failed to insert TikTok resource:`, error);
        }
      }
    }
    
    // YouTube
    if (socialMedia?.youtube && socialMedia.youtube.length > 0) {
      for (const video of socialMedia.youtube) {
        try {
          const { data: resource } = await insertEnhancedResource({
            title: video.title,
            url: video.url,
            type: "YouTube",
            video_thumbnail: video.thumbnail,
            video_duration: video.duration,
            author_name: video.author,
            views_count: video.views,
            embed_code: video.embed
          });
          
          if (resource) {
            await linkResourceToProduct(productId, resource.id, true);
            allResources.push(resource);
          }
        } catch (error) {
          logError(`Failed to insert YouTube resource:`, error);
        }
      }
    }
    
    // Articles
    if (articles && articles.length > 0) {
      for (const article of articles) {
        try {
          const { data: resource } = await insertEnhancedResource({
            title: article.title,
            url: article.url,
            type: "Article",
            video_thumbnail: article.thumbnail,
            author_name: article.source
          });
          
          if (resource) {
            await linkResourceToProduct(productId, resource.id);
            allResources.push(resource);
          }
        } catch (error) {
          logError(`Failed to insert article resource:`, error);
        }
      }
    }
    
    logInfo(`Successfully processed ${allResources.length} resources for product ${productId}`);
  } catch (error) {
    logError(`Error in storeProductReviewsAndResources:`, error);
    // Don't throw to avoid interrupting the main process
  }
}


/**
 * Process and store reviews from a batch response
 * @param batchReviewsData Batch review data with all products
 * @returns Promise that resolves when processing is complete
 */
export async function processBatchReviews(batchReviewsData: any): Promise<void> {
  try {
    if (!batchReviewsData || !batchReviewsData.products) {
      logError("Invalid batch reviews data format");
      return;
    }
    
    const productIds = Object.keys(batchReviewsData.products);
    logInfo(`Processing batch reviews for ${productIds.length} products`);
    
    // Process each product in parallel
    await Promise.all(productIds.map(async (productId) => {
      const productData = batchReviewsData.products[productId];
      
      try {
        // Store product rating
        if (productData.rating && productData.rating.averageRating) {
          await supabase
            .from("products")
            .update({
              rating: productData.rating.averageRating,
              rating_count: productData.rating.totalReviews || 0,
              rating_source: productData.rating.source || null
            })
            .eq("id", productId);
            
          logInfo(`Updated product ${productId} with rating: ${productData.rating.averageRating}`);
        }
        
        // Store individual reviews
        const reviews = productData.reviews || [];
        if (reviews.length > 0) {
          const insertedReviews = [];
          const failedReviews = [];
          
          for (const review of reviews) {
            try {
              const { data, error } = await supabase
                .from("reviews")
                .insert({
                  product_id: productId,
                  rating: review.rating,
                  author_name: review.author,
                  author_avatar: review.avatar,
                  review_text: review.text,
                  source: review.source,
                  source_url: review.sourceUrl,
                  verified_purchase: review.verifiedPurchase,
                  date: review.date,
                });
                
              if (error) {
                logError(`Failed to insert review for product ${productId}:`, error);
                failedReviews.push(review);
              } else if (data) {
                insertedReviews.push(data);
              }
            } catch (reviewError) {
              logError(`Error inserting review for product ${productId}:`, reviewError);
              failedReviews.push(review);
            }
          }
          
          logInfo(`Processed ${insertedReviews.length} reviews for product ${productId} (${failedReviews.length} failed)`);
        } else {
          logInfo(`No reviews found for product ${productId}`);
        }
        
        // Mark reviews as loaded
        await supabase
          .from("products")
          .update({ loading_reviews: false })
          .eq("id", productId);
          
      } catch (productError) {
        logError(`Error processing reviews for product ${productId}:`, productError);
        
        // Ensure loading state is updated even on error
        await supabase
          .from("products")
          .update({ loading_reviews: false })
          .eq("id", productId);
      }
    }));
    
    logInfo(`Completed batch reviews processing for ${productIds.length} products`);
  } catch (error) {
    logError(`Error in processBatchReviews:`, error);
    
    // Try to mark all products as not loading
    if (batchReviewsData && batchReviewsData.products) {
      const productIds = Object.keys(batchReviewsData.products);
      try {
        await supabase
          .from("products")
          .update({ loading_reviews: false })
          .in("id", productIds);
      } catch (updateError) {
        logError(`Failed to update loading states for reviews:`, updateError);
      }
    }
  }
}

/**
 * Process and store resources from a batch response
 * @param batchResourcesData Batch resources data with all products
 * @returns Promise that resolves when processing is complete
 */
export async function processBatchResources(batchResourcesData: any): Promise<void> {
  try {
    if (!batchResourcesData || !batchResourcesData.products) {
      logError("Invalid batch resources data format");
      return;
    }
    
    const productIds = Object.keys(batchResourcesData.products);
    logInfo(`Processing batch resources for ${productIds.length} products`);
    
    // Process each product in parallel
    await Promise.all(productIds.map(async (productId) => {
      const productData = batchResourcesData.products[productId];
      
      try {
        const allResources = [];
        
        // Process Instagram posts
        if (productData.socialMedia?.instagram && productData.socialMedia.instagram.length > 0) {
          for (const post of productData.socialMedia.instagram) {
            try {
              const { data: resource, error } = await supabase
                .from("resources")
                .insert({
                  title: post.caption ? `Instagram: ${post.caption.substring(0, 50)}...` : `Instagram post by ${post.author}`,
                  url: post.url,
                  type: "Instagram",
                  video_thumbnail: post.thumbnail,
                  author_name: post.author,
                  author_handle: post.authorHandle,
                  views_count: post.views,
                  likes_count: post.likes,
                  caption: post.caption,
                  content_type: post.type || "post"
                })
                .select()
                .single();
                
              if (error) {
                logError(`Failed to insert Instagram resource for product ${productId}:`, error);
              } else if (resource) {
                // Link resource to product
                await supabase
                  .from("product_resources")
                  .insert({
                    product_id: productId,
                    resource_id: resource.id,
                    is_featured: true // Mark Instagram content as featured
                  });
                  
                allResources.push(resource);
              }
            } catch (resourceError) {
              logError(`Error processing Instagram resource for product ${productId}:`, resourceError);
            }
          }
          
          logInfo(`Processed ${productData.socialMedia.instagram.length} Instagram resources for product ${productId}`);
        }
        
        // Process TikTok videos
        if (productData.socialMedia?.tiktok && productData.socialMedia.tiktok.length > 0) {
          for (const video of productData.socialMedia.tiktok) {
            try {
              const { data: resource, error } = await supabase
                .from("resources")
                .insert({
                  title: video.caption ? `TikTok: ${video.caption.substring(0, 50)}...` : `TikTok by ${video.author}`,
                  url: video.url,
                  type: "TikTok",
                  video_thumbnail: video.thumbnail,
                  author_name: video.author,
                  author_handle: video.authorHandle,
                  views_count: video.views,
                  likes_count: video.likes,
                  embed_code: video.embed,
                  caption: video.caption
                })
                .select()
                .single();
                
              if (error) {
                logError(`Failed to insert TikTok resource for product ${productId}:`, error);
              } else if (resource) {
                // Link resource to product
                await supabase
                  .from("product_resources")
                  .insert({
                    product_id: productId,
                    resource_id: resource.id,
                    is_featured: true // Mark TikTok content as featured
                  });
                  
                allResources.push(resource);
              }
            } catch (resourceError) {
              logError(`Error processing TikTok resource for product ${productId}:`, resourceError);
            }
          }
          
          logInfo(`Processed ${productData.socialMedia.tiktok.length} TikTok resources for product ${productId}`);
        }
        
        // Process YouTube videos
        if (productData.socialMedia?.youtube && productData.socialMedia.youtube.length > 0) {
          for (const video of productData.socialMedia.youtube) {
            try {
              const { data: resource, error } = await supabase
                .from("resources")
                .insert({
                  title: video.title || `YouTube video by ${video.author}`,
                  url: video.url,
                  type: "YouTube",
                  video_thumbnail: video.thumbnail,
                  video_duration: video.duration,
                  author_name: video.author,
                  views_count: video.views,
                  embed_code: video.embed,
                  publish_date: video.publishDate,
                  description: video.description
                })
                .select()
                .single();
                
              if (error) {
                logError(`Failed to insert YouTube resource for product ${productId}:`, error);
              } else if (resource) {
                // Link resource to product
                await supabase
                  .from("product_resources")
                  .insert({
                    product_id: productId,
                    resource_id: resource.id,
                    is_featured: true // Mark YouTube content as featured
                  });
                  
                allResources.push(resource);
              }
            } catch (resourceError) {
              logError(`Error processing YouTube resource for product ${productId}:`, resourceError);
            }
          }
          
          logInfo(`Processed ${productData.socialMedia.youtube.length} YouTube resources for product ${productId}`);
        }
        
        // Process blog articles
        if (productData.articles && productData.articles.length > 0) {
          for (const article of productData.articles) {
            try {
              const { data: resource, error } = await supabase
                .from("resources")
                .insert({
                  title: article.title || `Article from ${article.source}`,
                  url: article.url,
                  type: "Article",
                  video_thumbnail: article.thumbnail,
                  author_name: article.author || article.source,
                  publish_date: article.publishDate,
                  description: article.excerpt
                })
                .select()
                .single();
                
              if (error) {
                logError(`Failed to insert article resource for product ${productId}:`, error);
              } else if (resource) {
                // Link resource to product - articles are not featured by default
                await supabase
                  .from("product_resources")
                  .insert({
                    product_id: productId,
                    resource_id: resource.id,
                    is_featured: false
                  });
                  
                allResources.push(resource);
              }
            } catch (resourceError) {
              logError(`Error processing article resource for product ${productId}:`, resourceError);
            }
          }
          
          logInfo(`Processed ${productData.articles.length} article resources for product ${productId}`);
        }
        
        // Mark resources as loaded
        await supabase
          .from("products")
          .update({ loading_resources: false })
          .eq("id", productId);
          
        logInfo(`Completed resources processing for product ${productId}, stored ${allResources.length} total resources`);
      } catch (productError) {
        logError(`Error processing resources for product ${productId}:`, productError);
        
        // Ensure loading state is updated even on error
        await supabase
          .from("products")
          .update({ loading_resources: false })
          .eq("id", productId);
      }
    }));
    
    logInfo(`Completed batch resources processing for ${productIds.length} products`);
  } catch (error) {
    logError(`Error in processBatchResources:`, error);
    
    // Try to mark all products as not loading
    if (batchResourcesData && batchResourcesData.products) {
      const productIds = Object.keys(batchResourcesData.products);
      try {
        await supabase
          .from("products")
          .update({ loading_resources: false })
          .in("id", productIds);
      } catch (updateError) {
        logError(`Failed to update loading states for resources:`, updateError);
      }
    }
  }
}