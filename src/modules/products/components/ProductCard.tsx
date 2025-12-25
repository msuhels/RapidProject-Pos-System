'use client';

import { ShoppingCart, Tag } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const selling = parseFloat(product.sellingPrice || '0');
  const originalPrice = parseFloat(product.price || '0');
  const discountValue = parseFloat(product.discountValue || '0');
  const discountType = product.discountType;
  
  let discountAmount = 0;
  let discountPercent = 0;
  if (discountType === 'percentage' && originalPrice > 0) {
    discountAmount = originalPrice * (discountValue / 100);
    discountPercent = discountValue;
  } else if (originalPrice > 0) {
    discountAmount = discountValue;
    discountPercent = (discountAmount / originalPrice) * 100;
  }
  
  const isOutOfStock = product.status === 'out_of_stock';
  const hasDiscount = discountValue > 0 && discountAmount > 0;
  
  return (
    <div className="group relative bg-white dark:bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full">
      {/* Product Image - Square/Rectangular like Flipkart */}
      <div className="relative w-full aspect-square bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          </div>
        )}
        
        {/* Discount Badge - Top Left (Flipkart Style) */}
        {hasDiscount && (
          <div className="absolute top-2 left-2">
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
              {discountPercent > 0 ? `${discountPercent.toFixed(0)}% off` : 'Special Offer'}
            </div>
          </div>
        )}
      </div>
      
      {/* Product Info - Clean Data Display */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Product Name - 2 lines max, truncated */}
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 min-h-[2.5rem] leading-snug">
          {product.name}
        </h3>
        
        {/* Category - Subtle */}
        {product.category && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {product.category}
          </p>
        )}
        
        {/* Pricing Section - Flipkart Style */}
        <div className="mt-auto space-y-1">
          {/* Final Selling Price - Large and Bold */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ${selling.toFixed(2)}
            </span>
          </div>
          
          {/* Original Price with Strikethrough */}
          {hasDiscount && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <span className="text-xs text-green-600 dark:text-green-500 font-medium">
                Save ${discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Show original price if no discount */}
          {!hasDiscount && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Actual Price: ${originalPrice.toFixed(2)}
            </div>
          )}
        </div>
        
        {/* Add to Cart Button - Simple and Clean */}
        <div className="mt-4">
          {onAddToCart && !isOutOfStock && (
            <Button
              onClick={() => onAddToCart(product)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 h-9 rounded-md transition-colors"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
          
          {isOutOfStock && (
            <Button
              disabled
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm py-2 h-9 rounded-md"
            >
              Out of Stock
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

