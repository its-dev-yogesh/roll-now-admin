import type { ReactNode } from "react";
import { cx } from "./cx";

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

const alignClass = (align?: string) => align && align !== "left" && `align-${align}`;

export function DataTable<T>({ columns, rows, keyExtractor, emptyMessage = "Nothing here yet." }: DataTableProps<T>) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className={cx(alignClass(column.align))}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyExtractor(row)}>
              {columns.map((column, index) => (
                <td key={index} className={cx(alignClass(column.align))}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty">{emptyMessage}</div>}
    </div>
  );
}
