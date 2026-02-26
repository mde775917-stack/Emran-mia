import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = '01320512829';
  const message = encodeURIComponent('Hi, I need help');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-6 z-[99] bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={24} fill="white" />
    </a>
  );
};

export default WhatsAppButton;
