type Step = {
  title: string;
  desc: string;
};

export function DocsFlowPipeline({ steps }: { steps: Step[] }) {
  return (
    <div className="docs-pipeline" role="list">
      {steps.map((step, idx) => (
        <div key={step.title} className="docs-pipeline-step" role="listitem">
          <div className="docs-pipeline-node">
            <span className="docs-pipeline-index">{String(idx + 1).padStart(2, "0")}</span>
            <p className="docs-pipeline-title">{step.title}</p>
            <p className="docs-pipeline-desc">{step.desc}</p>
          </div>
          {idx < steps.length - 1 ? <span className="docs-pipeline-connector" aria-hidden /> : null}
        </div>
      ))}
    </div>
  );
}
