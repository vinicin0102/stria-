import { useState } from "react";
import { clinic } from "../config/clinic";

interface DoctorAvatarProps {
  size?: number;
  ring?: boolean;
}

function initials(name: string) {
  return name
    .replace(/^Dra?\.?\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function DoctorAvatar({ size = 48, ring = true }: DoctorAvatarProps) {
  // A foto real só existe depois que o arquivo é colocado em public/.
  // Até lá (ou se falhar ao carregar) mostramos o monograma.
  const [showPhoto, setShowPhoto] = useState(Boolean(clinic.doctor.photo));

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cream-deep ${
        ring ? "ring-1 ring-gold/40" : ""
      }`}
      style={{ width: size, height: size }}
    >
      {showPhoto ? (
        <img
          src={clinic.doctor.photo}
          alt={clinic.doctor.name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setShowPhoto(false)}
        />
      ) : (
        <span
          className="font-display font-medium text-rose"
          style={{ fontSize: size * 0.36, letterSpacing: "0.02em" }}
        >
          {initials(clinic.doctor.name)}
        </span>
      )}
    </span>
  );
}
