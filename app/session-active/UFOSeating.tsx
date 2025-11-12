"use client";

interface Seat {
  uniqueID: string;
  seatID: string;
  firstName: string;
  lastName: string;
  linkedinURL: string;
  email: string;
}

interface UFOSeatingProps {
  insideSeats: Seat[];
  outsideSeats: Seat[];
  offset: number;
}

export default function UFOSeating({
  insideSeats,
  outsideSeats,
  offset,
}: UFOSeatingProps) {
  // Calculate offset-based rotation for inner circle
  // When offset increases by 1, inner circle rotates clockwise to align with next outside seat
  const offsetRotation = offset * (360 / outsideSeats.length);

  // Calculate position for circular layout
  const getPosition = (
    index: number,
    total: number,
    radius: number
  ) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // Start from top
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  // Get paired outside seat for an inside seat
  const getPairedOutsideSeat = (insideIndex: number, currentOffset: number) => {
    const pairedIndex = (insideIndex + currentOffset) % outsideSeats.length;
    return outsideSeats[pairedIndex];
  };

  return (
    <div className="relative w-full max-w-4xl aspect-square">
      {/* UFO Base Structure */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Outer ring of UFO */}
        <div className="absolute w-[90%] h-[90%] rounded-full border-4 border-zinc-400 dark:border-zinc-600 bg-gradient-to-b from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 opacity-30"></div>
        
        {/* Middle ring */}
        <div className="absolute w-[70%] h-[70%] rounded-full border-2 border-zinc-500 dark:border-zinc-500 bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-800 opacity-20"></div>
        
        {/* Inner ring */}
        <div className="absolute w-[50%] h-[50%] rounded-full border-2 border-zinc-600 dark:border-zinc-400 bg-gradient-to-b from-zinc-400 to-zinc-500 dark:from-zinc-600 dark:to-zinc-700 opacity-15"></div>
      </div>

      {/* Outer Circle (Outside Seats) - Static */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          {outsideSeats.map((seat, index) => {
            const { x, y } = getPosition(
              index,
              outsideSeats.length,
              45
            );
            return (
              <div
                key={seat.seatID}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `calc(50% + ${x}%)`,
                  top: `calc(50% + ${y}%)`,
                }}
              >
                <div className="bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-3 min-w-[120px] text-center shadow-lg backdrop-blur-sm">
                  <div className="font-bold text-sm text-blue-800 dark:text-blue-200">
                    {seat.seatID}
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {seat.firstName} {seat.lastName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inner Circle (Inside Seats) - Rotates smoothly to new positions based on offset */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `rotate(${offsetRotation}deg)`,
          transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth, natural rotation
          transformOrigin: "center center",
        }}
      >
        <div className="relative w-full h-full">
          {insideSeats.map((seat, index) => {
            const { x, y } = getPosition(
              index,
              insideSeats.length,
              25
            );
            const pairedSeat = getPairedOutsideSeat(index, offset);
            return (
              <div
                key={seat.seatID}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}%)`,
                  top: `calc(50% + ${y}%)`,
                  transform: `translate(-50%, -50%) rotate(${-offsetRotation}deg)`, // Counter-rotate to keep text upright
                  transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)", // Smooth transition
                  transformOrigin: "center center",
                }}
              >
                <div className="bg-green-100 dark:bg-green-900 border-2 border-green-300 dark:border-green-700 rounded-lg p-3 min-w-[120px] text-center shadow-lg backdrop-blur-sm">
                  <div className="font-bold text-sm text-green-800 dark:text-green-200">
                    {seat.seatID}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                    {seat.firstName} {seat.lastName}
                  </div>
                  {pairedSeat && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 border-t border-gray-300 dark:border-gray-600 pt-1">
                      ↔ {pairedSeat.seatID}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center UFO Core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          {/* Glowing center */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 dark:from-cyan-500 dark:to-blue-700 shadow-2xl flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-200 opacity-80"></div>
          </div>
          {/* UFO dome */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-8 rounded-t-full bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-700 border-2 border-zinc-400 dark:border-zinc-500"></div>
        </div>
      </div>

    </div>
  );
}

