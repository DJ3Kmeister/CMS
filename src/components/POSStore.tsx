import React, { useState } from "react";
import { Product, Computer, User } from "../types";
import { ShoppingBag, Zap, Flame, Cookie, Utensils, Coffee, Headphones, Ticket, Plus, Minus, Trash2, CheckCircle, CreditCard } from "lucide-react";

interface POSStoreProps {
  products: Product[];
  computers: Computer[];
  currentUser: User;
  onPlaceOrder: (userId: string, computerId: string | undefined, items: { productId: string; quantity: number }[]) => Promise<void>;
  onAddProduct?: (product: any) => void;
}

export const POSStore: React.FC<POSStoreProps> = ({
  products,
  computers,
  currentUser,
  onPlaceOrder,
  onAddProduct
}) => {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string>("pc-01");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const categories = ["TOUS", "Boissons", "Snacks", "Pass Gaming", "Équipements", "Drinks", "Gear"];

  const filteredProducts = selectedCategory === "TOUS"
    ? products
    : products.filter((p) => {
        if (selectedCategory === "Boissons" && (p.category === "Drinks" || p.category === "Boissons")) return true;
        if (selectedCategory === "Pass Gaming" && (p.category === "Gaming Passes" || p.category === "Pass Gaming")) return true;
        if (selectedCategory === "Équipements" && (p.category === "Gear" || p.category === "Équipements")) return true;
        return p.category === selectedCategory;
      });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + 1) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: Math.min(item.product.stock, newQty) } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; quantity: number }[]
    );
  };

  const totalCartPrice = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const items = cart.map((i) => ({ productId: i.product.id, quantity: i.quantity }));
      await onPlaceOrder(currentUser.id, selectedSeat, items);
      setCart([]);
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || "Order checkout failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap": return <Zap className="w-5 h-5 text-amber-400" />;
      case "Flame": return <Flame className="w-5 h-5 text-rose-400" />;
      case "Cookie": return <Cookie className="w-5 h-5 text-amber-500" />;
      case "Utensils": return <Utensils className="w-5 h-5 text-emerald-400" />;
      case "Coffee": return <Coffee className="w-5 h-5 text-amber-300" />;
      case "Headphones": return <Headphones className="w-5 h-5 text-cyan-400" />;
      case "Ticket": return <Ticket className="w-5 h-5 text-indigo-400" />;
      default: return <ShoppingBag className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Catalog Section */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Category Header */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-2 overflow-x-auto shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const inCart = cart.find((i) => i.product.id === prod.id);

            return (
              <div
                key={prod.id}
                className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                      {renderIcon(prod.icon)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      Stock: {prod.stock}
                    </span>
                  </div>

                  <h3 className="mt-3 font-bold text-slate-800 text-sm leading-snug">{prod.name}</h3>
                  <div className="mt-1 text-xs text-slate-500 font-medium">{prod.category}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    {prod.price.toLocaleString()} FCFA
                  </span>

                  <button
                    onClick={() => addToCart(prod)}
                    disabled={prod.stock === 0}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      prod.stock === 0
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : inCart
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {inCart ? `Au Panier (${inCart.quantity})` : "Ajouter"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Seat Delivery Checkout Cart */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-600" /> Caisse POS & Panier
            </h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              {cart.length} Articles
            </span>
          </div>

          {/* Seat Number Selector */}
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase text-slate-500">LIVRER AU POSTE DE TRAVAIL</label>
            <select
              value={selectedSeat}
              onChange={(e) => setSelectedSeat(e.target.value)}
              className="mt-1 w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-mono cursor-pointer"
            >
              {computers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ip})
                </option>
              ))}
            </select>
          </div>

          {/* Cart List */}
          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Votre panier est vide. Cliquez sur "+ Ajouter" pour commander.
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div key={product.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800">{product.name}</div>
                    <div className="text-emerald-700 font-mono mt-0.5">
                      {(product.price * quantity).toLocaleString()} FCFA
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold font-mono text-slate-800 px-1">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="p-1 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-1 text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Total & Submit Button */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {orderSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-2.5 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Commande enregistrée ! Livraison imminente au poste {selectedSeat.toUpperCase()}.
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-semibold">Total :</span>
            <span className="text-xl font-bold text-emerald-700 font-mono">
              {totalCartPrice.toLocaleString()} FCFA
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            Déduit directement du portefeuille ({currentUser.balance.toLocaleString()} FCFA disponible)
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
              cart.length === 0 || isSubmitting
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {isSubmitting ? "Traitement de la commande..." : "Confirmer & Payer avec le Solde"}
          </button>
        </div>
      </div>
    </div>
  );
};
