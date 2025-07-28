import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '', size = 'md' }) => {
  const logoUrl = "https://rrhtsqiscmofhuxasrpw.supabase.co/storage/v1/object/public/image.logo//ChatGPT%20Image%2029%20de%20mai.%20de%202025,%2016_16_01.png";
  
  let widthClass;
  switch (size) {
    case 'sm':
      widthClass = 'w-24'; // approx 96px
      break;
    case 'lg':
      widthClass = 'w-48'; // approx 192px
      break;
    case 'xl':
      widthClass = 'w-60'; // approx 240px for login page emphasis
      break;
    case 'md':
    default:
      widthClass = 'w-36'; // approx 144px
      break;
  }

  return (
    <Link to="/dashboard" className={`inline-block ${className}`}>
      <img-replace src={logoUrl} alt="OKR Planner Logo" className={`${widthClass} h-auto`} />
    </Link>
  );
};

export default Logo;