import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal/Reveal.jsx';
import Segmented from '../components/Segmented/Segmented.jsx';

const LETTERS = 'ABCDEF';

export function QuestionTags({ q }) {
  return (
    <div className="qtags">
      <span className="qtag">{q.year} · Q{q.number}</span>
      {q.group && <span className="qtag qtag--group" title={q.group.name}>{q.group.short}</span>}
    </div>
  );
}

export default function QuizResults({ questions, answers, subjectName, classLevel, onRetry }) {
  const [view, setView] = useState('all');

  const { correct, missed } = useMemo(() => {
    let right = 0;
    questions.forEach((x) => { if (answers[x.id] === x.correct) right += 1; });
    return { correct: right, missed: questions.length - right };
  }, [questions, answers]);

  const total = questions.length;
  const pct = Math.round((correct / total) * 100);
  const message = pct >= 80 ? 'Great work.' : pct >= 50 ? 'Good effort. Review the ones you missed.' : 'Keep practising. Review the answers below.';
  const rows = questions
    .map((x, i) => ({ x, i }))
    .filter(({ x }) => view === 'all' || answers[x.id] !== x.correct);

  return (
    <div className="qres">
      <Reveal className="qres__score glass">
        <p className="qres__label">{subjectName} · Class {classLevel}</p>
        <div className="qres__num">{correct}<span> / {total}</span></div>
        <p className="qres__pct">{pct}% correct · {message}</p>
        <div className="qres__actions">
          {missed > 0 && (
            <button type="button" className="btn btn--dark" onClick={onRetry}>Retry the {missed} missed</button>
          )}
          <Link to="/quiz" className="btn btn--glass">New quiz</Link>
        </div>
      </Reveal>

      {missed > 0 && (
        <Reveal className="qres__filter" delay={100}>
          <Segmented label="Show" value={view} onChange={setView}
            options={[{ value: 'all', label: 'All questions' }, { value: 'missed', label: `Missed (${missed})` }]} />
        </Reveal>
      )}

      <div className="qres__list">
        {rows.map(({ x, i }) => {
          const mine = answers[x.id];
          return (
            <Reveal as="article" key={x.id} delay={(i % 3) * 60} className="qcard glass">
              <div className="qtags">
                <span className="qtag">Question {i + 1}</span>
                <span className="qtag">{x.year} · Q{x.number}</span>
                {x.group && <span className="qtag qtag--group" title={x.group.name}>{x.group.short}</span>}
                {mine === undefined && <span className="qtag qtag--bad">Skipped</span>}
              </div>
              <h2 className="qbody">{x.body}</h2>
              {x.image && <img className="qimg" src={x.image} alt="" loading="lazy" />}
              <div className="qopts">
                {x.options.map((text, k) => {
                  const right = k === x.correct;
                  const wrong = mine === k && !right;
                  return (
                    <div key={k} className={`qopt qopt--static${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}>
                      <span className="qopt__key">{LETTERS[k]}</span>
                      <span className="qopt__text">{text}</span>
                      {mine === k && <span className="qopt__tag">Your answer</span>}
                      {right && <span className="qopt__tag">Correct</span>}
                    </div>
                  );
                })}
              </div>
              {x.explanation && <div className="qexp"><p>{x.explanation}</p></div>}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}