import React from 'react';
import Button from '../atoms/Button';
import Loading from '../atoms/Loading';
import Badge from '../atoms/Badge';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyMessage = 'Tidak ada data',
  className = '',
  onEdit,
  onDelete,
  onView,
  actions = [],
  ...props
}) => {
  const handleAction = (action, item) => {
    if (action === 'edit' && onEdit) {
      onEdit(item);
    } else if (action === 'delete' && onDelete) {
      onDelete(item);
    } else if (action === 'view' && onView) {
      onView(item);
    } else if (action.handler) {
      action.handler(item);
    }
  };

  const renderCell = (column, item) => {
    if (column.render) {
      return column.render(item[column.key], item);
    }

    if (column.type === 'badge') {
      return (
        <Badge 
          variant={item[column.badgeVariant] || 'primary'} 
          size="sm"
        >
          {item[column.key]}
        </Badge>
      );
    }

    if (column.type === 'date') {
      return new Date(item[column.key]).toLocaleDateString('id-ID');
    }

    return item[column.key] || '-';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loading text="Memuat data..." />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-box border border-base-content/5 bg-base-100 ${className}`} {...props}>
      <table className="table min-w-[800px]">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.headerClassName || ''}>
                {column.title}
              </th>
            ))}
            {(onEdit || onDelete || onView || actions.length > 0) && (
              <th className="text-center">Aksi</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length + ((onEdit || onDelete || onView || actions.length > 0) ? 1 : 0)} 
                className="text-center py-6 text-base-content/60"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map((column) => (
                  <td key={column.key} className={column.cellClassName || ''}>
                    {renderCell(column, item)}
                  </td>
                ))}
                {(onEdit || onDelete || onView || actions.length > 0) && (
                  <td className="text-center flex flex-wrap gap-2">
                    {onView && (
                      <Button
                        size="xs"
                        variant="info"
                        onClick={() => handleAction('view', item)}
                      >
                        Lihat
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        size="xs"
                        variant="warning"
                        onClick={() => handleAction('edit', item)}
                      >
                        Edit
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="xs"
                        variant="error"
                        onClick={() => handleAction('delete', item)}
                      >
                        Hapus
                      </Button>
                    )}
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        size="xs"
                        variant={action.variant || "primary"}
                        onClick={() => handleAction(action, item)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
