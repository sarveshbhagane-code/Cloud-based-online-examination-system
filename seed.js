const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

async function seed() {
  console.log('Seeding database...');
  db.data = { users: [], exams: [], questions: [], exam_attempts: [], exam_registrations: [] };

  const adminId = uuidv4();
  db.insert('users', { id: adminId, name: 'Admin User', email: 'admin@cloudexam.com', password: await bcrypt.hash('admin123', 10), role: 'admin', avatar_color: '#6366f1', created_at: new Date().toISOString() });

  const sIds = [], sData = [
    { name:'Rahul Sharma', email:'rahul@student.com', c:'#8b5cf6' },
    { name:'Priya Patel', email:'priya@student.com', c:'#ec4899' },
    { name:'Amit Kumar', email:'amit@student.com', c:'#f97316' },
    { name:'Sneha Reddy', email:'sneha@student.com', c:'#22c55e' },
    { name:'Vikram Singh', email:'vikram@student.com', c:'#3b82f6' }
  ];
  for (const s of sData) {
    const id = uuidv4(); sIds.push(id);
    db.insert('users', { id, name: s.name, email: s.email, password: await bcrypt.hash('student123', 10), role: 'student', avatar_color: s.c, created_at: new Date().toISOString() });
  }

  const e1 = uuidv4(), e2 = uuidv4(), e3 = uuidv4();
  db.insert('exams', { id:e1, title:'Cloud Computing Fundamentals', description:'Test your knowledge of cloud computing basics including IaaS, PaaS, SaaS, and deployment models.', subject:'Cloud Computing', duration:30, total_marks:10, passing_marks:6, max_attempts:2, status:'published', created_by:adminId, created_at:new Date().toISOString() });
  db.insert('exams', { id:e2, title:'AWS Services & Architecture', description:'Assessment on Amazon Web Services core services, architecture patterns, and best practices.', subject:'AWS', duration:45, total_marks:10, passing_marks:6, max_attempts:1, status:'published', created_by:adminId, created_at:new Date().toISOString() });
  db.insert('exams', { id:e3, title:'DevOps & CI/CD Pipeline', description:'Evaluate your understanding of DevOps practices, CI/CD tools, containerization, and orchestration.', subject:'DevOps', duration:40, total_marks:10, passing_marks:6, max_attempts:1, status:'published', created_by:adminId, created_at:new Date().toISOString() });

  const qs = [
    [e1,'What does IaaS stand for?',['Infrastructure as a Service','Internet as a Service','Integration as a Service','Information as a Service'],'Infrastructure as a Service'],
    [e1,'Which is NOT a cloud deployment model?',['Public Cloud','Private Cloud','Hybrid Cloud','Desktop Cloud'],'Desktop Cloud'],
    [e1,'What does SaaS provide?',['Hardware resources','Platform for development','Software applications over internet','Network infrastructure'],'Software applications over internet'],
    [e1,'Which company pioneered public cloud?',['Microsoft','Amazon','Google','IBM'],'Amazon'],
    [e1,'What is auto-scaling?',['Manual server management','Automatic resource adjustment based on demand','Fixed allocation','DB optimization'],'Automatic resource adjustment based on demand'],
    [e1,'What is a Virtual Machine?',['Physical server','Software emulation of a computer','Router','Storage device'],'Software emulation of a computer'],
    [e1,'What does PaaS stand for?',['Platform as a Service','Program as a Service','Protocol as a Service','Process as a Service'],'Platform as a Service'],
    [e1,'Benefit of cloud computing?',['Higher upfront cost','Reduced scalability','Pay-as-you-go pricing','Limited access'],'Pay-as-you-go pricing'],
    [e1,'What is multi-tenancy?',['Single user per server','Multiple users sharing resources','Multiple servers for one user','Dedicated hardware'],'Multiple users sharing resources'],
    [e1,'What is cloud elasticity?',['Fixed capacity','Ability to scale resources up and down','Network speed','Encryption'],'Ability to scale resources up and down'],
    [e2,'What is Amazon EC2?',['Database service','Virtual server service','Storage service','CDN service'],'Virtual server service'],
    [e2,'What does S3 stand for?',['Simple Storage Service','Secure Server System','Standard Service Suite','Simple Server Service'],'Simple Storage Service'],
    [e2,'Which AWS service is serverless?',['EC2','Lambda','RDS','VPC'],'Lambda'],
    [e2,'What is AWS VPC?',['Virtual Private Cloud','Virtual Public Connection','Virtual Processing Center','Virtual Protocol'],'Virtual Private Cloud'],
    [e2,'Which provides managed databases?',['EC2','S3','RDS','CloudFront'],'RDS'],
    [e2,'What is CloudFront?',['Compute','CDN service','Database','Messaging'],'CDN service'],
    [e2,'What does IAM stand for?',['Internet Access Mgmt','Identity and Access Management','Internal App Monitor','Infra Automation'],'Identity and Access Management'],
    [e2,'Container orchestration service?',['ECS','S3','SQS','SNS'],'ECS'],
    [e2,'What is Route 53?',['Computing','DNS service','Storage','Security'],'DNS service'],
    [e2,'What is an AWS Region?',['Single data center','Geographic area with multiple data centers','Protocol','Security zone'],'Geographic area with multiple data centers'],
    [e3,'What does CI/CD stand for?',['Continuous Integration/Continuous Deployment','Cloud Integration/Cloud Deployment','Code Inspection/Code Delivery','Continuous Inspection/Design'],'Continuous Integration/Continuous Deployment'],
    [e3,'Tool for containerization?',['Jenkins','Docker','Git','Ansible'],'Docker'],
    [e3,'Kubernetes is used for?',['Code compilation','Container orchestration','Version control','DB management'],'Container orchestration'],
    [e3,'What is a Docker image?',['Running container','Template for containers','Network config','Volume'],'Template for containers'],
    [e3,'Which is a CI/CD tool?',['Docker','Jenkins','Kubernetes','Terraform'],'Jenkins'],
    [e3,'What is Infrastructure as Code?',['Writing app code','Managing infrastructure through code','Coding standards','DB schema'],'Managing infrastructure through code'],
    [e3,'What does Git do?',['Container mgmt','Version control','Monitoring','Load balancing'],'Version control'],
    [e3,'What is a microservice?',['Large monolith','Small independent service','Database type','Protocol'],'Small independent service'],
    [e3,'What is Terraform?',['CI/CD tool','IaC tool','Container runtime','Monitor'],'IaC tool'],
    [e3,'What is a deployment pipeline?',['Network cable','Automated process from code to production','DB connection','FTP'],'Automated process from code to production'],
  ];
  qs.forEach((q, i) => db.insert('questions', { id:uuidv4(), exam_id:q[0], question_text:q[1], question_type:'mcq', options:q[2], correct_answer:q[3], marks:1, order_index:i%10 }));

  // Sample attempts
  [[e1,0,8,80],[e1,1,9,90],[e1,2,6,60],[e2,0,7,70],[e2,3,5,50],[e3,1,10,100],[e3,4,8,80]].forEach(([eid,si,sc,pct]) => {
    db.insert('exam_attempts', { id:uuidv4(), exam_id:eid, user_id:sIds[si], start_time:new Date(Date.now()-86400000).toISOString(), end_time:new Date(Date.now()-85200000).toISOString(), time_spent:1200, score:sc, total_marks:10, percentage:pct, status:'completed', answers:{} });
  });

  console.log('Done! Admin: admin@cloudexam.com / admin123 | Student: rahul@student.com / student123');
}
seed().catch(console.error);
