import React from 'react';
import { StudentView } from '../components/student/StudentView';
import { Order } from '../types';

interface StudentPageProps {
  onOpenCart: () => void;
  onOpenActiveOrder: () => void;
  onOpenTracker: (order: Order) => void;
}

export const StudentPage: React.FC<StudentPageProps> = (props) => {
  return <StudentView {...props} />;
};

export default StudentPage;
