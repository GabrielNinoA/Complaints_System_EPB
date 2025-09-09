import React, { useState, useEffect } from 'react';

const MathCaptcha = ({ onValidate, isValid, resetTrigger, darkTheme }) => {
  const [question, setQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(null);

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let result;
    switch (operation) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      default:
        result = num1 + num2;
    }
    
    setQuestion(`${num1} ${operation} ${num2} = ?`);
    setCorrectAnswer(result);
    setUserAnswer('');
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [resetTrigger]);

  useEffect(() => {
    const userNum = parseInt(userAnswer);
    if (!isNaN(userNum) && userNum === correctAnswer) {
      onValidate(true);
    } else {
      onValidate(false);
    }
  }, [userAnswer, correctAnswer, onValidate]);

  const handleInputChange = (e) => {
    setUserAnswer(e.target.value);
  };

  const handleRefresh = () => {
    generateQuestion();
  };

  return React.createElement('div', {
    className: 'math-captcha'
  },
    React.createElement('div', {
      className: 'captcha-question'
    }, question),
    
    React.createElement('div', {
      style: { marginBottom: '1rem' }
    },
      React.createElement('input', {
        type: 'number',
        className: 'captcha-input',
        value: userAnswer,
        onChange: handleInputChange,
        placeholder: '?'
      }),
      React.createElement('button', {
        type: 'button',
        onClick: handleRefresh,
        style: {
          marginLeft: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      }, '↻')
    ),
    
    React.createElement('div', {
      className: `captcha-status ${isValid ? 'captcha-valid' : 'captcha-invalid'}`
    }, isValid ? '✓ Correcto' : userAnswer ? '✗ Incorrecto' : 'Resuelve la operación')
  );
};

export default MathCaptcha;
