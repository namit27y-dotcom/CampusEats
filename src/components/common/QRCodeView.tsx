import React from 'react';

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
}

// Deterministic matrix generator for visually sharp QR simulation
export const QRCodeView: React.FC<QRCodeViewProps> = ({ value, size = 160, className = '' }) => {
  // Generate a 21x21 pseudo-QR grid based on the hash of value
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Position detection patterns (top-left, top-right, bottom-left)
  const drawCorner = (rStart: number, cStart: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[rStart + r][cStart + c] = isBorder || isCenter;
      }
    }
  };

  drawCorner(0, 0);
  drawCorner(0, gridSize - 7);
  drawCorner(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Pseudo-random data filling using string characters
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) % 100000;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite corners
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= gridSize - 8;
      const inBottomLeft = r >= gridSize - 8 && c < 8;
      if (!inTopLeft && !inTopRight && !inBottomLeft && !(r === 6 || c === 6)) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        cells[r][c] = (seed % 100) > 46;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div className={`inline-block p-3 bg-white rounded-xl shadow-sm border border-zinc-200 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shape-rendering-crispEdges block"
      >
        <rect width={size} height={size} fill="#ffffff" />
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#18181b"
                rx={0.5}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
