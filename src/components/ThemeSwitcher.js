import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import './ThemeSwitcher.css';

const themes = [
  { id: 'orange', label: 'Orange', color: '#F97316' },
  { id: 'blue',   label: 'Blue',   color: '#3B82F6' },
  { id: 'green',  label: 'Green',  color: '#10B981' },
  { id: 'purple', label: 'Purple', color: '#8B5CF6' },
  { id: 'dark',   label: 'Dark',   color: '#1E1E1E' },
];

export default function ThemeSwitcher() {
  const { theme, changeTheme } = useContext(ThemeContext);

  return (
    <div className="theme-switcher">
      {themes.map((t) => (
        <button
          key={t.id}
          className={`theme-dot ${theme === t.id ? 'active' : ''}`}
          style={{ backgroundColor: t.color }}
          title={t.label}
          onClick={() => changeTheme(t.id)}
        />
      ))}
    </div>
  );
}
