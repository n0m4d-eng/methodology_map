export function LaneHeader({ data }) {
  return (
    <div className="lane-header-node" style={{ width: 210 }}>
      {data.label}
    </div>
  )
}
