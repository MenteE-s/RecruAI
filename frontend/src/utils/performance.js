import React, { useState, useEffect, useCallback, useMemo } from "react";
import { List } from "react-window";

// Virtualized List Component for large datasets
export const VirtualizedList = ({
  items,
  itemHeight = 120,
  renderItem,
  className = "",
  emptyMessage = "No items found",
  height = 600,
}) => {
  // Ensure items is always an array
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const itemData = useMemo(() => {
    const data = { items: safeItems, renderItem };
    console.log("VirtualizedList itemData:", data);
    return data;
  }, [safeItems, renderItem]);

  if (!safeItems || safeItems.length === 0) {
    return (
      <div
        className={`flex items-center justify-center p-8 text-gray-500 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  const Row = ({ index, style, data }) => {
    const { items: listItems, renderItem: renderFunction } = data;
    const item = listItems[index];

    return (
      <div style={style} className="px-2">
        {renderFunction(item, index)}
      </div>
    );
  };

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={safeItems.length}
        itemSize={itemHeight}
        itemData={itemData}
        width="100%"
      >
        {Row}
      </List>
    </div>
  );
};

// Debounced search hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Lazy loading hook with intersection observer
export const useLazyLoad = (callback, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  const observer = useMemo(() => {
    return new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && callback) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );
  }, [callback, options]);

  useEffect(() => {
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [element, observer]);

  return [setElement, isIntersecting];
};

// Data sanitization utility
export const sanitizeHtml = (html) => {
  if (!html) return "";

  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Remove potentially dangerous elements and attributes
  const dangerousElements = ["script", "style", "iframe", "object", "embed"];
  const dangerousAttributes = ["onload", "onerror", "onclick", "onmouseover"];

  dangerousElements.forEach((tag) => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  });

  // Remove dangerous attributes
  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((el) => {
    dangerousAttributes.forEach((attr) => {
      el.removeAttribute(attr);
    });
  });

  return tempDiv.innerHTML;
};

// Safe text truncation
export const truncateText = (text, maxLength = 100, suffix = "...") => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

// Memory-safe data chunking
export const chunkArray = (array, chunkSize = 50) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Error boundary for list components
export class ListErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("List component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">
            Unable to load the list. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Optimized loading states
export const LoadingSkeleton = ({ height = 120, count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className={`bg-gray-200 rounded-lg`} style={{ height }}></div>
        </div>
      ))}
    </div>
  );
};

// Progressive loading hook
export const useProgressiveLoad = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(page);
      if (result && result.data) {
        setData((prev) => [...prev, ...result.data]);
        setHasMore(result.hasMore || false);
        setPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, page, loading, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    reset();
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, hasMore, loadMore, reset };
};
