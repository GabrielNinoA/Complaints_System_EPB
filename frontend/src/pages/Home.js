import React from 'react';

const Home = () => {
  return (
    <div className="page-container">
      <div className="home-container">
        <img 
          src="/resources/wallpaper.png"
          alt="Logo Quejas Boyacá"
          className="home-wallpaper-img"
          style={{
            maxWidth: '100%',
            maxHeight: '60vh',
            height: 'auto',
            objectFit: 'contain'
          }}
        />
      </div>
    </div>
  );
};

export default Home;
