// 로그인/관리자 페이지 공용 Supabase 클라이언트 초기화.
// 이 파일 전에 supabase-js CDN 스크립트가 먼저 로드되어 있어야 합니다.
window.sbClient = window.supabase.createClient(
  'https://euiyywzyhvxstqxqbpek.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1aXl5d3p5aHZ4c3RxeHFicGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxODcyNzUsImV4cCI6MjEwMzc2MzI3NX0.LT-1BYihLZAFsUwO8TNZ6dNp8mNwl27IDPmvcF7yFu8'
);
