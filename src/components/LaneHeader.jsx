export function LaneHeader({ data }) {
  return (
    <div className="lane-header-node" style={{ width: 260 }}>
      {data.label}
    </div>
  )
}
