// pages/index.js

export default function Home() {
  return (
    <div style={{
      background: "black",
      color: "white",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        Nandan Traders V1
      </h1>

      <p style={{ marginBottom: "2rem" }}>
        Welcome to your wholesale platform.
      </p>

      <a href="/catalog" style={{
        background: "#fff",
        padding: "10px 20px",
        borderRadius: "6px",
        color: "black",
        textDecoration: "none",
        fontWeight: "bold"
      }}>
        View Products
      </a>
    </div>
  );
}
