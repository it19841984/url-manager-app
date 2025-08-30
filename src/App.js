import React, { useState, useEffect, useCallback, useMemo } from 'react';

const App = () => {
  const [urlItems, setUrlItems] = useState([]);
  const [filterGenre, setFilterGenre] = useState('すべて');
  const [readStatusFilter, setReadStatusFilter] = useState('すべて');
  const [sortBy, setSortBy] = useState('created');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // LocalStorageからデータを読み込み
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('urlItems');
      if (storedItems) {
        const parsedItems = JSON.parse(storedItems);
        const migratedItems = parsedItems.map(item => ({
          id: item.id || new Date().toISOString(),
          url: item.url || '',
          isRead: item.isRead || false,
          rating: item.rating || 0,
          priority: item.priority || 0,
          genre: item.genre || '未分類',
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        setUrlItems(migratedItems.filter(item => item.url));
      }
    } catch (error) {
      console.error("Failed to load items from localStorage", error);
    }
  }, []);

  // LocalStorageにデータを保存
  useEffect(() => {
    try {
      localStorage.setItem('urlItems', JSON.stringify(urlItems));
    } catch (error) {
      console.error("Failed to save items to localStorage", error);
    }
  }, [urlItems]);

  const addUrlItem = useCallback((url, genre) => {
    if (url && !urlItems.some(item => item.url === url)) {
      const newItem = {
        id: new Date().toISOString(),
        url,
        genre,
        isRead: false,
        rating: 0,
        priority: 0,
        createdAt: new Date().toISOString(),
      };
      setUrlItems(prevItems => [...prevItems, newItem]);
    }
  }, [urlItems]);

  const deleteUrlItem = useCallback((id) => {
    setUrlItems(prevItems => prevItems.filter(item => item.id !== id));
  }, []);

  const toggleReadStatus = useCallback((id) => {
    setUrlItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isRead: !item.isRead } : item
      )
    );
  }, []);

  const setRating = useCallback((id, rating) => {
    setUrlItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, rating } : item
      )
    );
  }, []);

  const setPriority = useCallback((id, priority) => {
    setUrlItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, priority } : item
      )
    );
  }, []);

  const moveUrlItem = useCallback((index, direction) => {
    setUrlItems(prevItems => {
      const newItems = [...prevItems];
      const itemToMove = newItems[index];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;

      if (swapIndex < 0 || swapIndex >= newItems.length) {
        return newItems;
      }

      newItems[index] = newItems[swapIndex];
      newItems[swapIndex] = itemToMove;
      return newItems;
    });
  }, []);

  const handleSort = useCallback((newSortBy) => {
    if (sortBy === newSortBy) {
      // 同じソート項目なら方向を変更
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // 新しいソート項目なら初期方向を設定
      setSortBy(newSortBy);
      setSortDirection(newSortBy === 'created' ? 'desc' : 'asc');
    }
  }, [sortBy]);

  const genres = ['すべて', ...Array.from(new Set(urlItems.map(item => item.genre)))];
  
  // フィルタリングとソート
  const filteredAndSortedItems = useMemo(() => {
    let filtered = urlItems.filter(item => {
      const matchesGenre = filterGenre === 'すべて' || item.genre === filterGenre;
      const matchesSearch = searchQuery === '' || 
        item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesReadStatus = readStatusFilter === 'すべて' ||
        (readStatusFilter === '未読' && !item.isRead) ||
        (readStatusFilter === '既読' && item.isRead);
      
      return matchesGenre && matchesSearch && matchesReadStatus;
    });

    // ソート処理
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          comparison = b.priority - a.priority; // 高い優先度が先
          break;
        case 'rating':
          comparison = b.rating - a.rating; // 高い評価が先
          break;
        case 'created':
          comparison = new Date(b.createdAt) - new Date(a.createdAt); // 新しいものが先
          break;
        case 'genre':
          comparison = a.genre.localeCompare(b.genre, 'ja');
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [urlItems, filterGenre, searchQuery, readStatusFilter, sortBy, sortDirection]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My favorite web site list
          </h1>
          <p className="mt-2 text-slate-600">気になるWebサイトをリストアップして、管理しましょう。</p>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-slate-700">新しいURLを追加</h2>
          <UrlInput onAdd={addUrlItem} />
        </div>

        {/* 検索バー */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SearchIcon className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-700">検索</h2>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="URLやジャンルで検索..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
          {searchQuery && (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                「{searchQuery}」の検索結果: {filteredAndSortedItems.length}件
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-sky-600 hover:text-sky-800"
              >
                クリア
              </button>
            </div>
          )}
        </div>

        {urlItems.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            {/* フィルタ部分 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <GenreFilter
                genres={genres}
                selectedGenre={filterGenre}
                onFilterChange={setFilterGenre}
              />
              <ReadStatusFilter
                selectedStatus={readStatusFilter}
                onFilterChange={setReadStatusFilter}
              />
            </div>
            
            {/* ソート部分 */}
            <div className="border-t pt-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-700 mr-2 flex items-center">並び順:</span>
                <SortButton 
                  sortBy="created" 
                  currentSort={sortBy} 
                  sortDirection={sortDirection}
                  onClick={handleSort}
                  label="追加日時"
                />
                <SortButton 
                  sortBy="priority" 
                  currentSort={sortBy} 
                  sortDirection={sortDirection}
                  onClick={handleSort}
                  label="優先度"
                />
                <SortButton 
                  sortBy="rating" 
                  currentSort={sortBy} 
                  sortDirection={sortDirection}
                  onClick={handleSort}
                  label="評価"
                />
                <SortButton 
                  sortBy="genre" 
                  currentSort={sortBy} 
                  sortDirection={sortDirection}
                  onClick={handleSort}
                  label="ジャンル"
                />
              </div>
            </div>
            
            {/* 統計情報 */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-slate-900">{urlItems.length}</div>
                <div className="text-slate-600">総数</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">{urlItems.filter(item => !item.isRead).length}</div>
                <div className="text-slate-600">未読</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-green-600">{urlItems.filter(item => item.isRead).length}</div>
                <div className="text-slate-600">既読</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-yellow-600">{filteredAndSortedItems.length}</div>
                <div className="text-slate-600">表示中</div>
              </div>
            </div>
          </div>
        )}

        <UrlList
          items={filteredAndSortedItems}
          allItems={urlItems}
          onDelete={deleteUrlItem}
          onToggleRead={toggleReadStatus}
          onSetRating={setRating}
          onSetPriority={setPriority}
          onMove={moveUrlItem}
        />
      </main>
    </div>
  );
};

// UrlInput コンポーネント
const UrlInput = ({ onAdd }) => {
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('未分類');
  const [customGenre, setCustomGenre] = useState('');
  const [isCustomGenre, setIsCustomGenre] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      const finalGenre = isCustomGenre && customGenre.trim() ? customGenre.trim() : genre;
      onAdd(url.trim(), finalGenre);
      setUrl('');
      setGenre('未分類');
      setCustomGenre('');
      setIsCustomGenre(false);
    }
  };

  const handleGenreChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomGenre(true);
      setGenre('未分類');
    } else {
      setIsCustomGenre(false);
      setGenre(value);
      setCustomGenre('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 mb-2">
          URL
        </label>
        <input
          id="url-input"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          required
        />
      </div>
      <div>
        <label htmlFor="genre-select" className="block text-sm font-medium text-slate-700 mb-2">
          ジャンル
        </label>
        <select
          id="genre-select"
          value={isCustomGenre ? 'custom' : genre}
          onChange={handleGenreChange}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        >
          <option value="未分類">未分類</option>
          <option value="custom">+ 新しいジャンルを追加</option>
        </select>
        
        {isCustomGenre && (
          <input
            type="text"
            value={customGenre}
            onChange={(e) => setCustomGenre(e.target.value)}
            placeholder="新しいジャンル名を入力"
            className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            autoFocus
          />
        )}
      </div>
      <button
        type="submit"
        className="w-full bg-sky-600 text-white py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors"
      >
        追加
      </button>
    </form>
  );
};

// GenreFilter コンポーネント
const GenreFilter = ({ genres, selectedGenre, onFilterChange }) => {
  return (
    <div>
      <label htmlFor="genre-filter" className="block text-sm font-medium text-slate-700 mb-2">
        ジャンルで絞り込み
      </label>
      <select
        id="genre-filter"
        value={selectedGenre}
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
      >
        {genres.map(genre => (
          <option key={genre} value={genre}>{genre}</option>
        ))}
      </select>
    </div>
  );
};

// ReadStatusFilter コンポーネント
const ReadStatusFilter = ({ selectedStatus, onFilterChange }) => {
  return (
    <div>
      <label htmlFor="read-status-filter" className="block text-sm font-medium text-slate-700 mb-2">
        未読・既読で絞り込み
      </label>
      <select
        id="read-status-filter"
        value={selectedStatus}
        onChange={(e) => onFilterChange(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
      >
        <option value="すべて">すべて</option>
        <option value="未読">未読のみ</option>
        <option value="既読">既読のみ</option>
      </select>
    </div>
  );
};

// SortButton コンポーネント
const SortButton = ({ sortBy, currentSort, sortDirection, onClick, label }) => {
  const isActive = currentSort === sortBy;
  const showArrow = isActive;
  
  return (
    <button
      onClick={() => onClick(sortBy)}
      className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-sky-100 text-sky-700 border border-sky-300' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
      }`}
    >
      <span>{label}</span>
      {showArrow && (
        sortDirection === 'asc' ? 
          <ArrowUpIcon className="h-3 w-3" /> : 
          <ArrowDownIcon className="h-3 w-3" />
      )}
    </button>
  );
};

// UrlList コンポーネント
const UrlList = ({ items, allItems, onDelete, onToggleRead, onSetRating, onSetPriority, onMove }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {allItems.length === 0 ? 'リストは空です' : '該当するアイテムがありません'}
        </h3>
        <p className="text-slate-500">
          {allItems.length === 0 
            ? '上部のフォームからURLを追加してください。'
            : '検索条件やフィルターを変更してみてください。'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const originalIndex = allItems.findIndex(originalItem => originalItem.id === item.id);
        return (
          <UrlItem
            key={item.id}
            item={item}
            index={originalIndex}
            onDelete={onDelete}
            onToggleRead={onToggleRead}
            onSetRating={onSetRating}
            onSetPriority={onSetPriority}
            onMove={onMove}
            canMoveUp={originalIndex > 0}
            canMoveDown={originalIndex < allItems.length - 1}
          />
        );
      })}
    </div>
  );
};

// UrlItem コンポーネント
const UrlItem = ({ item, index, onDelete, onToggleRead, onSetRating, onSetPriority, onMove, canMoveUp, canMoveDown }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '日時不明';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${item.isRead ? 'border-green-500 bg-green-50' : 'border-sky-500'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {item.genre}
            </span>
            {item.isRead && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                既読
              </span>
            )}
            {item.priority > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                優先度 {item.priority}
              </span>
            )}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 hover:text-sky-800 font-medium text-sm break-all"
          >
            {item.url}
          </a>
          <div className="flex items-center mt-2">
            <span className="text-sm text-slate-500 mr-2">優先度:</span>
            <StarRating 
              rating={item.priority} 
              onRate={(priority) => onSetPriority(item.id, priority)}
              color="red"
            />
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-slate-500 mr-2">評価:</span>
            <StarRating 
              rating={item.rating} 
              onRate={(rating) => onSetRating(item.id, rating)}
              color="yellow"
            />
          </div>
          <div className="flex items-center mt-2 text-xs text-slate-400">
            <CalendarIcon className="h-3 w-3 mr-1" />
            <span>追加日時: {formatDate(item.createdAt)}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <div className="flex gap-1">
            {canMoveUp && (
              <button
                onClick={() => onMove(index, 'up')}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="上に移動"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            )}
            {canMoveDown && (
              <button
                onClick={() => onMove(index, 'down')}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="下に移動"
              >
                <ArrowDownIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onToggleRead(item.id)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                item.isRead
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {item.isRead ? '未読' : '既読'}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// StarRating コンポーネント
const StarRating = ({ rating, onRate, color = 'yellow' }) => {
  const colorClasses = {
    yellow: {
      active: 'text-yellow-400',
      inactive: 'text-slate-300',
      hover: 'hover:text-yellow-400'
    },
    red: {
      active: 'text-red-400',
      inactive: 'text-slate-300',
      hover: 'hover:text-red-400'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className={`text-lg ${
            star <= rating ? colors.active : colors.inactive
          } ${colors.hover} transition-colors`}
        >
          ★
        </button>
      ))}
    </div>
  );
};

// アイコンコンポーネント
const SearchIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowUpIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ArrowDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default App;
