import React from 'react';

const MOTES = [
  [4, 16], [13, 72], [8, 43], [22, 9], [35, 87], [47, 5], [62, 94],
  [76, 12], [91, 28], [96, 65], [84, 84], [3, 91], [57, 39], [72, 64],
];

export default function EnchantedAtmosphere({ enabled }) {
  return (
    <div className="enchanted-atmosphere" aria-hidden="true" hidden={!enabled}>
      {MOTES.map(([x, y], index) => (
        <span key={index} className="magic-mote" style={{ left: `${x}%`, top: `${y}%`, '--delay': `${-index * 2.7}s`, '--duration': `${14 + index % 4 * 3}s` }} />
      ))}
    </div>
  );
}
