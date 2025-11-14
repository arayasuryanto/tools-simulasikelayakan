'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Upload, Download } from 'lucide-react';
import { CapexItem, OpexItem } from '@/types/financial';
import { v4 as uuidv4 } from 'uuid';

interface DataEditorProps {
  title: string;
  items: CapexItem[] | OpexItem[];
  onChange: (items: CapexItem[] | OpexItem[]) => void;
  color: 'primary' | 'success' | 'danger';
  unitPlaceholder: string;
}

export default function DataEditor({ title, items, onChange, color, unitPlaceholder }: DataEditorProps) {
  const [newItem, setNewItem] = useState({
    name: '',
    volume: 1,
    unit: unitPlaceholder,
    price: 0
  });
  const [bulkData, setBulkData] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const colorClasses = {
    primary: 'border-blue-500 focus:border-blue-500 bg-blue-50',
    success: 'border-green-500 focus:border-green-500 bg-green-50',
    danger: 'border-red-500 focus:border-red-500 bg-red-50'
  };

  const buttonColors = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    success: 'bg-green-500 hover:bg-green-600',
    danger: 'bg-red-500 hover:bg-red-600'
  };

  const addNewItem = () => {
    if (newItem.name && newItem.volume > 0 && newItem.price > 0) {
      const updatedItems = [...items, {
        id: uuidv4(),
        ...newItem
      }];
      onChange(updatedItems);
      setNewItem({ name: '', volume: 1, unit: unitPlaceholder, price: 0 });
    }
  };

  const updateItem = (id: string, field: keyof CapexItem, value: string | number) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange(updatedItems);
  };

  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    onChange(updatedItems);
  };

  const duplicateItem = (item: CapexItem | OpexItem) => {
    const updatedItems = [...items, { ...item, id: uuidv4() }];
    onChange(updatedItems);
  };

  const bulkAdd = () => {
    try {
      const lines = bulkData.trim().split('\n');
      const newItems: CapexItem[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.includes('\t') ? line.split('\t') : line.split(',').map(p => p.trim());

        if (parts.length >= 4) {
          const name = parts[0].trim();
          const volume = parseFloat(parts[1]);
          const unit = parts[2].trim();
          const price = parseFloat(parts[3].replace(/[^0-9.-]/g, ''));

          if (name && volume > 0 && price > 0) {
            newItems.push({
              id: uuidv4(),
              name,
              volume,
              unit,
              price
            });
          }
        }
      }

      onChange([...items, ...newItems]);
      setBulkData('');
      setShowBulkAdd(false);
    } catch (error) {
      console.error('Error importing bulk data:', error);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (Array.isArray(data)) {
            onChange(data);
          }
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const calculateTotal = (item: CapexItem | OpexItem) => item.volume * item.price;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => document.getElementById(`import-${title}`)?.click()}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Import from JSON"
          >
            <Upload size={16} />
          </button>
          <input
            id={`import-${title}`}
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
          <button
            onClick={exportData}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Export to JSON"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Bulk Add Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowBulkAdd(!showBulkAdd)}
          className={`${buttonColors[color]} text-white px-4 py-2 rounded-md flex items-center space-x-2`}
        >
          <Plus size={16} />
          <span>Bulk Add from Clipboard</span>
        </button>

        {showBulkAdd && (
          <div className="mt-4 p-4 border rounded-md bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">
              Paste data from Excel/Google Sheets (columns: Name | Qty | Unit | Price)
            </p>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={6}
              placeholder="Copy rows from Excel/Sheets and paste here. Format: Name[TAB]Qty[TAB]Unit[TAB]Price"
            />
            <button
              onClick={bulkAdd}
              className={`${buttonColors[color]} text-white px-4 py-2 rounded-md mt-2`}
            >
              Import All Rows
            </button>
          </div>
        )}
      </div>

      {/* Add New Item Form */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Add New Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="col-span-2 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Qty"
            min="0"
            value={newItem.volume}
            onChange={(e) => setNewItem({ ...newItem, volume: parseFloat(e.target.value) || 0 })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Unit"
            value={newItem.unit}
            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Price"
            min="0"
            step="10000"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addNewItem}
            className={`${buttonColors[color]} text-white px-4 py-2 rounded-md`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Items List */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Current Items</h3>
        {items.length === 0 ? (
          <p className="text-gray-500 italic">No items added yet. Add items above to get started.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-7 gap-2 p-3 border rounded-md hover:bg-gray-50">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="col-span-2 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  value={item.volume}
                  onChange={(e) => updateItem(item.id, 'volume', parseFloat(e.target.value) || 0)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={item.price}
                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="text-right font-semibold py-1">
                  Rp {calculateTotal(item).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => duplicateItem(item)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Duplicate"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-right">
            <span className="text-lg font-semibold text-gray-700">TOTAL: </span>
            <span className="text-xl font-bold text-gray-900">
              Rp {items.reduce((sum, item) => sum + calculateTotal(item), 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}