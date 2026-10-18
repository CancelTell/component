/*
  Stylised hand for the assembly scenes. Local coordinates: (0, 0) is the contact point
  (fingertip or the spot between thumb and index), fingers point up, the arm goes down (+y)
  and out of the frame. Position and rotate it with a parent <g>.
*/
type Pose = 'pinch' | 'press' | 'flat';

function Finger({ x, y, h, w = 14, r = 0, cx = 0, cy = 0, nail = false }: { x: number; y: number; h: number; w?: number; r?: number; cx?: number; cy?: number; nail?: boolean }) {
  return (
    <g transform={r ? `rotate(${r} ${cx} ${cy})` : undefined}>
      <rect className="hand__skin" x={x} y={y} width={w} height={h} rx={w / 2} />
      {nail && <rect className="hand__nail" x={x + 3} y={y + 3} width={w - 6} height={9} rx={4} />}
    </g>
  );
}

function Sleeve() {
  return (
    <>
      <path className="hand__sleeve" d="M-31 96 L31 96 L36 320 L-36 320 Z" />
      <rect className="hand__cuff" x={-34} y={90} width={68} height={16} rx={6} />
    </>
  );
}

export function Hand({ pose }: { pose: Pose }) {
  if (pose === 'flat') {
    return (
      <g className="hand">
        <Sleeve />
        <rect className="hand__skin" x={-30} y={34} width={60} height={64} rx={20} />
        <Finger x={-29} y={4} h={48} w={13} />
        <Finger x={-14} y={-4} h={56} w={13} nail />
        <Finger x={1} y={-2} h={54} w={13} nail />
        <Finger x={16} y={6} h={46} w={12} />
        <Finger x={-34} y={40} h={48} w={15} r={-30} cx={-26} cy={86} />
      </g>
    );
  }
  if (pose === 'press') {
    return (
      <g className="hand">
        <Sleeve />
        <rect className="hand__skin" x={-28} y={36} width={58} height={62} rx={22} />
        <Finger x={-2} y={30} h={26} w={14} />
        <Finger x={11} y={34} h={24} w={13} />
        <Finger x={22} y={42} h={20} w={11} />
        <Finger x={-15} y={-2} h={62} w={15} nail />
        <rect className="hand__skin" x={-34} y={58} width={44} height={16} rx={8} transform="rotate(-18 -12 66)" />
      </g>
    );
  }
  // pinch: thumb and index meet at the origin
  return (
    <g className="hand">
      <Sleeve />
      <rect className="hand__skin" x={-24} y={38} width={60} height={60} rx={22} />
      <Finger x={12} y={30} h={28} w={13} />
      <Finger x={23} y={36} h={24} w={12} />
      <Finger x={31} y={46} h={18} w={10} />
      <Finger x={-1} y={-2} h={56} w={14} r={-4.4} cx={6} cy={52} nail />
      <Finger x={-37.5} y={-5} h={65} w={15} r={26.6} cx={-30} cy={58} />
    </g>
  );
}
