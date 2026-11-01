import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2, AlertCircle } from 'lucide-react';

interface SwipeableTableRowProps {
  id: string;
  onDelete: () => void;
  deleteLabel?: string;
  threshold?: number;
  children: React.ReactNode;
  className?: string;
}

export const SwipeableTableRow: React.FC<SwipeableTableRowProps> = ({
  id,
  onDelete,
  deleteLabel = 'اسحب للحذف',
  threshold = -80,
  children,
  className = '',
}) => {
  const x = useMotionValue(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Background action opacity & scale based on drag distance
  const deleteOpacity = useTransform(x, [0, -40, threshold], [0, 0.6, 1]);
  const deleteScale = useTransform(x, [0, threshold], [0.8, 1.1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x <= threshold) {
      // Swiped past threshold -> trigger action
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
        setIsDeleting(false);
      }, 200);
    }
  };

  return (
    <div className="relative overflow-hidden group select-none">
      {/* Background Hidden Action (Revealed on Swipe) */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-rose-600 to-rose-700 flex items-center justify-center text-white z-0 px-4 rounded-xl shadow-inner cursor-pointer"
        onClick={() => onDelete()}
      >
        <motion.div
          style={{ scale: deleteScale }}
          className="flex items-center gap-1.5 font-bold text-xs"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" />
          <span>حذف</span>
        </motion.div>
      </motion.div>

      {/* Foreground Draggable Row Container */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.15}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileDrag={{ cursor: 'grabbing' }}
        className={`relative z-10 bg-white dark:bg-stone-900 transition-colors ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
};
