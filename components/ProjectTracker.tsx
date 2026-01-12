
import React from 'react';
import { Project, Deliverable, DeliverableStatus } from '../types';
import { Calendar, CheckCircle2, Circle, Clock, LayoutGrid, List } from 'lucide-react';

interface ProjectTrackerProps {
  projects: Project[];
  deliverables: Deliverable[];
}

const ProjectTracker: React.FC<ProjectTrackerProps> = ({ projects, deliverables }) => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Operations</h1>
          <p className="text-gray-500">Track milestones, deliverables, and velocity.</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
          <button className="p-1.5 bg-gray-100 text-gray-900 rounded shadow-sm"><LayoutGrid size={18} /></button>
          <button className="p-1.5 text-gray-400"><List size={18} /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {projects.map((project) => {
          const projectDeliverables = deliverables.filter(d => d.projectId === project.id);
          const completedCount = projectDeliverables.filter(d => d.status === DeliverableStatus.DELIVERED).length;
          const progress = projectDeliverables.length > 0 ? (completedCount / projectDeliverables.length) * 100 : 0;

          return (
            <div key={project.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    project.status === 'Active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {project.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-gray-500">Velocity Progress</span>
                    <span className="text-gray-900">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar size={14} />
                    Due {new Date(project.endDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CheckCircle2 size={14} />
                    {completedCount}/{projectDeliverables.length} Deliverables
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 flex-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Active Deliverables</h4>
                <div className="space-y-3">
                  {projectDeliverables.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        {d.status === DeliverableStatus.DELIVERED ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : d.status === DeliverableStatus.IN_PROGRESS ? (
                          <Clock size={18} className="text-blue-500" />
                        ) : (
                          <Circle size={18} className="text-gray-300" />
                        )}
                        <span className={`text-sm font-medium ${d.status === DeliverableStatus.DELIVERED ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {d.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(d.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectTracker;
