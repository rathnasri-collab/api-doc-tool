'use client';

import { API_CATEGORIES, SUB_APIS } from '@/lib/constants';

interface Props {
  value: string;        // comma-separated category ids
  subApis: string;      // comma-separated sub-api ids
  onChange: (categories: string, subApis: string) => void;
}

export default function Step1Category({ value, subApis, onChange }: Props) {
  const selectedCategories = value ? value.split(',') : [];
  const selectedSubApis = subApis ? subApis.split(',') : [];

  const toggleCategory = (catId: string) => {
    let newCategories: string[];
    if (selectedCategories.includes(catId)) {
      newCategories = selectedCategories.filter((c) => c !== catId);
    } else {
      newCategories = [...selectedCategories, catId];
    }

    // If contact is deselected, clear contact sub-apis
    let newSubApis = selectedSubApis;
    if (!newCategories.includes('contact')) {
      newSubApis = [];
    }

    onChange(newCategories.join(','), newSubApis.join(','));
  };

  const toggleSubApi = (subApiId: string) => {
    let newSubApis: string[];
    if (selectedSubApis.includes(subApiId)) {
      newSubApis = selectedSubApis.filter((s) => s !== subApiId);
    } else {
      newSubApis = [...selectedSubApis, subApiId];
    }
    onChange(value, newSubApis.join(','));
  };

  // Categories that have sub-APIs to select
  const categoriesWithSubApis = ['contact'];

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Select API Category</h2>
      <p className="text-sm text-gray-500 mb-6">Choose one or more API categories. For categories with sub-APIs, select the ones you need.</p>

      <div className="space-y-4">
        {API_CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          const catSubApis = SUB_APIS[cat.id] || [];
          const hasSubApis = categoriesWithSubApis.includes(cat.id) && catSubApis.length > 0;
          return (
            <div key={cat.id}>
              <label
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(cat.id)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                </div>
              </label>

              {/* Show sub-APIs when selected */}
              {hasSubApis && isSelected && (
                <div className="ml-8 mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Select Sub-APIs:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {catSubApis.map((sub) => {
                      const isSubSelected = selectedSubApis.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSubSelected
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSubSelected}
                            onChange={() => toggleSubApi(sub.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{sub.label}</span>
                            <p className="text-xs text-gray-500">{sub.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
