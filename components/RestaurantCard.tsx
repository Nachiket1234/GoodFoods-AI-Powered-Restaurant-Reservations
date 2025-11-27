import React from 'react';
import { Restaurant } from '../types';
import { MapPin, Clock, Users, DollarSign, Star } from 'lucide-react';

interface Props {
  data: Restaurant;
  onBookClick: (name: string) => void;
}

const RestaurantCard: React.FC<Props> = ({ data, onBookClick }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-w-[280px] w-full max-w-[320px] flex flex-col space-y-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{data.name}</h3>
          <p className="text-sm text-gray-500 font-medium">{data.cuisine}</p>
        </div>
        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-xs font-bold">
          <Star size={12} className="mr-1 fill-yellow-500 text-yellow-500" />
          {data.rating.toFixed(1)}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 line-clamp-2">{data.description}</p>
      
      <div className="flex flex-wrap gap-2">
        {data.features.slice(0, 3).map((feat, idx) => (
          <span key={idx} className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {feat}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center">
            <MapPin size={14} className="mr-1.5" /> {data.location}
        </div>
        <div className="flex items-center">
            <DollarSign size={14} className="mr-1.5" /> {data.priceRange}
        </div>
        <div className="flex items-center">
            <Clock size={14} className="mr-1.5" /> {data.openHour}:00 - {data.closeHour}:00
        </div>
        <div className="flex items-center">
            <Users size={14} className="mr-1.5" /> Max {data.capacity}
        </div>
      </div>

      <button 
        onClick={() => onBookClick(data.name)}
        className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center"
      >
        Check Availability
      </button>
    </div>
  );
};

export default RestaurantCard;