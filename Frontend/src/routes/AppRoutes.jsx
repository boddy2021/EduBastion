import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from "../pages/LoginPage/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage/RegisterPage.jsx";
import HomePage from "../pages/HomePage/HomePage.jsx";
import SetupProfilePage from "../pages/SetupProfilePage/SetupProfilePage.jsx";
import DashboardPage from "../pages/DashboardPage/DashboardPage.jsx";
import ProfilePage from "../pages/ProfilePage/ProfilePage.jsx";

import CreateClassPage from '../pages/CreateClassPage/CreateClassPage.jsx';
import JoinClassPage from '../pages/JoinClassPage/JoinClassPage.jsx';
import ManageClassPage from '../pages/ManageClassPage/ManageClassPage.jsx';

import CreateCoursePage from '../pages/CreateCoursePage/CreateCoursePage.jsx';
import ManageCoursePage from '../pages/ManageCoursePage/ManageCoursePage.jsx';

import CreateQuizPage from '../pages/CreateQuizPage/CreateQuizPage.jsx';
import TakeQuizPage from '../pages/TakeQuizPage/TakeQuizPage.jsx';
import QuizResultPage from '../pages/QuizResultPage/QuizResultPage.jsx';
import QuizSubmissionsPage from '../pages/QuizSubmissionsPage/QuizSubmissionsPage.jsx';

import RoleBasedRoute from "../components/Router/RoleBasedRoute.jsx";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<RoleBasedRoute allowedRole="any" mustHaveProfile={false} />}>
                <Route path="/setup-profile" element={<SetupProfilePage />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRole="any" mustHaveProfile={true} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                <Route path="/class/:classId" element={<ManageClassPage />} />

                <Route path="/course/:courseId" element={<ManageCoursePage />} />

                <Route path="/quiz/result/:submissionId" element={<QuizResultPage />} />
            </Route>

           <Route element={<RoleBasedRoute allowedRole="professor" mustHaveProfile={true} />}>
                <Route path="/create-class" element={<CreateClassPage />} />
                <Route path="/class/:classId/create-course" element={<CreateCoursePage />} />

                <Route path="/class/:classId/create-quiz" element={<CreateQuizPage />} />

                <Route path="/class/:classId/edit-quiz/:quizId" element={<CreateQuizPage />} />

                <Route path="/quiz/:quizId/submissions" element={<QuizSubmissionsPage />} />
            </Route>

            <Route element={<RoleBasedRoute allowedRole="student" mustHaveProfile={true} />}>
                <Route path="/join-class" element={<JoinClassPage />} />

                <Route path="/quiz/:quizId/take" element={<TakeQuizPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;