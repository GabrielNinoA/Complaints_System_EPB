import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({ options, selectedOption, onSelect, placeholder, displayKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (option) => {
    onSelect(option);
    setIsOpen(false);
  };

  const displayText = selectedOption 
    ? (displayKey ? selectedOption[displayKey] : selectedOption)
    : placeholder;

  return React.createElement('div', {
    className: 'dropdown',
    ref: dropdownRef
  },
    React.createElement('button', {
      type: 'button',
      className: 'dropdown-button',
      onClick: () => setIsOpen(!isOpen)
    }, displayText),
    
    isOpen && React.createElement('div', {
      className: 'dropdown-menu'
    },
      options.map((option) =>
        React.createElement('div', {
          key: option.id,
          className: 'dropdown-item',
          onClick: () => handleOptionClick(option)
        }, displayKey ? option[displayKey] : option)
      )
    )
  );
};

export default Dropdown;
