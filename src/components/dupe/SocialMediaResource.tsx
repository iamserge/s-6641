import React from 'react';
import { motion } from 'framer-motion';
import { EnhancedResource } from '@/types/dupe';
import { ExternalLink, Play, Youtube, Instagram, Link } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SocialMediaResourceProps {
  resource: EnhancedResource;
  index?: number;
}

export const SocialMediaResource = ({ resource, index = 0 }: SocialMediaResourceProps) => {
  const getResourceEmbed = () => {
    // Determine which embed to use based on URL or type
    const url = resource.url;
    
    if (url.includes('youtube.com') || url.includes('youtu.be') || resource.type === 'YouTube') {
      return (
        <div className="relative h-full">
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            {resource.video_thumbnail && (
              <div 
                className="absolute inset-0 bg-cover bg-center z-0" 
                style={{ backgroundImage: `url(${resource.video_thumbnail})` }}
              />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
              <div className="rounded-full w-16 h-16 bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </div>
          </div>
          <div className="w-full h-44 bg-black rounded-xl"></div>
        </div>
      );
    } else if (url.includes('instagram.com') || resource.type === 'Instagram') {
      return (
        <div className="relative rounded-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"/>
          {resource.video_thumbnail ? (
            <img 
              src={resource.video_thumbnail} 
              alt={resource.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-60 bg-gray-100 flex items-center justify-center">
              <Instagram className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
            <h3 className="font-medium line-clamp-2">{resource.title}</h3>
            <p className="text-xs text-white/80 mt-1">{resource.author_name || 'Instagram'}</p>
          </div>
        </div>
      );
    } else if (url.includes('tiktok.com') || resource.type === 'TikTok') {
      return (
        <div className="relative rounded-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"/>
          {resource.video_thumbnail ? (
            <img 
              src={resource.video_thumbnail} 
              alt={resource.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-60 bg-gray-100 flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
            <h3 className="font-medium line-clamp-2">{resource.title}</h3>
            <p className="text-xs text-white/80 mt-1">{resource.author_name || 'TikTok'}</p>
          </div>
        </div>
      );
    } else {
      // Generic or article embed with image if available
      return (
        <div className="relative rounded-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"/>
          {resource.video_thumbnail ? (
            <img 
              src={resource.video_thumbnail} 
              alt={resource.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-60 bg-gray-100 flex items-center justify-center">
              <Link className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-20">
            <h3 className="font-medium line-clamp-2">{resource.title}</h3>
            <p className="text-xs text-white/80 mt-1">{resource.author_name || 'Article'}</p>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white">
              {resource.type}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-30">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
        </div>
      );
    }
  };

  const getResourceIcon = () => {
    const type = resource.type;
    const className = "w-4 h-4";
    
    switch(type) {
      case 'YouTube':
        return <Youtube className={className} />;
      case 'Instagram':
        return <Instagram className={className} />;
      case 'TikTok':
        return <Play className={className} />;
      case 'Article':
      case 'Reddit':
      case 'Video':
      default:
        return <Link className={className} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
      className="rounded-xl overflow-hidden shadow-sm bg-white"
    >
      <a 
        href={resource.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block h-full"
      >
        <div className="relative">
          {getResourceEmbed()}
          {resource.type !== 'YouTube' && (
            <div className="absolute top-3 right-3 z-20">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-gray-700 flex items-center gap-1">
                {getResourceIcon()}
                {resource.type}
              </Badge>
            </div>
          )}
        </div>
      </a>
      
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2">{resource.title}</h3>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>{resource.author_name || resource.author_handle}</span>
          <div className="flex items-center gap-2">
            {resource.views_count !== undefined && (
              <span>{resource.views_count?.toLocaleString()} views</span>
            )}
            {resource.video_duration && (
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{resource.video_duration}</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};