export function TestSettings() {
  console.log('🧪 TestSettings sendo renderizado!');
  
  return (
    <div style={{ backgroundColor: 'red', color: 'white', padding: '20px', minHeight: '100vh' }}>
      <h1>🧪 TESTE - Se você vê isso, a navegação funciona!</h1>
      <p>Este é um teste básico sem contexto, sem hooks, sem nada complexo.</p>
      <button 
        onClick={() => {
          console.log('🔙 Tentando voltar...');
          window.location.reload(); // Para voltar à tela principal
        }}
        style={{ 
          backgroundColor: 'white', 
          color: 'red', 
          padding: '10px 20px', 
          marginTop: '20px',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔙 Voltar (Recarregar página)
      </button>
    </div>
  );
}
