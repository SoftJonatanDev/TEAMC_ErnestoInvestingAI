import { Medal, TrendingUp, UserRound } from "lucide-react";
import { Card, Notice, PageHeader, Trend } from "../components/ui";

const users = [
  ["Valeria M.", 68420, 26.8],
  ["Diego Quant", 63810, 21.4],
  ["Lucía Trader", 60970, 18.9],
  ["Marco P.", 57420, 14.2],
  ["Ana BVL", 55190, 10.8],
  ["Ernesto (Tú)", 52340, 7.6],
  ["Carlos ETF", 50820, 4.9],
  ["Sofía IA", 49210, 1.7],
  ["Juan Beta", 47190, -2.1],
];

export default function Leaderboard() {
  return (
    <>
      <PageHeader
        eyebrow="Comunidad DEMO"
        title="Leaderboard"
        description="Ranking ficticio por valor total del portafolio simulado."
        action={
          <span className="profile-pill">
            <UserRound size={15} />
            Tu posición: 6.º
          </span>
        }
      />
      <Notice>
        Usuarios, rendimientos y posiciones son ficticios; se actualizan con el entorno de
        simulación.
      </Notice>
      <div className="podium">
        {[users[1], users[0], users[2]].map((user, visualIndex) => {
          const position = visualIndex === 0 ? 2 : visualIndex === 1 ? 1 : 3;
          return (
            <Card key={user[0] as string} className={`podium-card place-${position}`}>
              <span className="podium-rank">
                <Medal size={21} />
                {position}.º
              </span>
              <div className="avatar">{(user[0] as string).slice(0, 1)}</div>
              <h2>{user[0]}</h2>
              <strong>US$ {(user[1] as number).toLocaleString()}</strong>
              <Trend value={user[2] as number} />
            </Card>
          );
        })}
      </div>
      <Card className="ranking-card">
        <div className="section-head">
          <h2>Ranking general</h2>
          <span>Retorno acumulado</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Posición</th>
                <th>Trader</th>
                <th>Valor del portafolio</th>
                <th>Retorno</th>
                <th>Rendimiento</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user[0] as string} className={index === 5 ? "current-user" : ""}>
                  <td>
                    <b>{index + 1}.º</b>
                  </td>
                  <td>
                    <span className="user-cell">
                      <span className="mini-avatar">{(user[0] as string)[0]}</span>
                      <b>{user[0]}</b>
                      {index === 5 && <em>Tú</em>}
                    </span>
                  </td>
                  <td>US$ {(user[1] as number).toLocaleString()}</td>
                  <td>
                    <Trend value={user[2] as number} />
                  </td>
                  <td>
                    <span className="performance-bar">
                      <i style={{ width: `${Math.max(8, ((user[2] as number) + 5) * 2.8)}%` }} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ranking-note">
          <TrendingUp size={17} />
          <span>
            Tu portafolio simulado está <b>7,6 %</b> sobre el valor inicial.
          </span>
        </div>
      </Card>
    </>
  );
}
