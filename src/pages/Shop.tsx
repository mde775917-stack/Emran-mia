import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { ShoppingCart, Search, Filter, Loader2 } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="pb-24 pt-6 px-6 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EarnEase Shop</h1>
          <p className="text-gray-500 text-sm">Premium Bangladeshi T-shirts</p>
        </div>
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-600">
            <ShoppingCart size={24} />
          </div>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </div>
      </header>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold whitespace-nowrap">All Items</div>
        <div className="px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-semibold whitespace-nowrap border border-gray-100">T-Shirts</div>
        <div className="px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-semibold whitespace-nowrap border border-gray-100">Polos</div>
        <div className="px-4 py-2 bg-white text-gray-600 rounded-xl text-sm font-semibold whitespace-nowrap border border-gray-100">New Arrival</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-emerald-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-0 overflow-hidden flex flex-col">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-emerald-600 font-bold mt-1">{product.price} BDT</p>
                <Button 
                  variant="secondary" 
                  className="mt-3 py-2 text-xs w-full"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
