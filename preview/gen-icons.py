# Generates shims/lucide-react.tsx from the icons used in src (preview only)
import re, glob
src = open('/home/claude/.npm-global/lib/node_modules/react-icons/lu/index.d.ts').read()
avail = set(re.findall(r'const Lu(\w+):', src))
used = set()
for f in glob.glob('/home/claude/component/src/**/*.tsx', recursive=True):
    for m in re.finditer(r"import \{([^}]*)\} from 'lucide-react'", open(f).read()):
        for n in m.group(1).split(','):
            n = n.strip()
            if n and not n.startswith('type '): used.add(n)
lines = ["import type { SVGProps } from 'react';", "import * as Lu from 'react-icons/lu';", "",
 "export type LucideProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string; color?: string };",
 "const wrap = (C: any) => ({ size = 24, strokeWidth = 2, ...rest }: LucideProps) => <C size={size} strokeWidth={strokeWidth} {...rest} />;"]
for n in sorted(used - {'Gpu'}):
    assert n in avail, n
    lines.append(f"export const {n} = wrap(Lu.Lu{n});")
lines.append("""export const Gpu = ({ size = 24, strokeWidth = 2, color = 'currentColor', ...rest }: LucideProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    <path d="M2 21V3" /><path d="M2 5h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.26" /><path d="M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3" /><circle cx="16" cy="11" r="2" /><circle cx="8" cy="11" r="2" />
  </svg>
);""")
open('/home/claude/component/preview/shims/lucide-react.tsx', 'w').write('\n'.join(lines) + '\n')
print(sorted(used))
