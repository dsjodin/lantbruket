interface TableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  className?: string;
}

export default function Table({ headers, rows, className = "" }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-stone-200">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left py-2 px-3 font-semibold text-stone-600"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-stone-100 hover:bg-stone-50">
              {row.map((cell, j) => (
                <td key={j} className="py-2 px-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
