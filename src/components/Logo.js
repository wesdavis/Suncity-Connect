export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* The Core / Sun */}
      <circle cx="50" cy="50" r="20" className="fill-purple-500" />
      
      {/* The Digital Orbit / Connection Ring */}
      <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="6" strokeDasharray="40 15" className="text-blue-500" />
      
      {/* The Connection Nodes */}
      <circle cx="85" cy="50" r="6" className="fill-white" />
      <circle cx="15" cy="50" r="6" className="fill-white" />
      <circle cx="50" cy="15" r="6" className="fill-white" />
      <circle cx="50" cy="85" r="6" className="fill-white" />
      
      {/* Inner Spark */}
      <path d="M50 38L53 47H62L54 53L57 62L50 56L43 62L46 53L38 47H47L50 38Z" className="fill-white" />
    </svg>
  );
}