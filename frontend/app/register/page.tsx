"use client";
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const authURL = "http://localhost:8080";
export default function Register() {
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [role, setRole] = useState<string>('customer');
    const [license, setLicense] = useState<string>('');
    const [vehicle, setVehicle] = useState<string>('');
    const router = useRouter();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        axios.post(`${authURL}/register`, {
            name,
            email,
            password,
            role,
        })
            .then((response) => {
                console.log(response.data);
                if (role === 'customer') {
                    router.replace('/login');
                } else {
                    axios.post(`${authURL}/register/additional`, {
                        license_no: license,
                        vehicle_no: vehicle,
                        email,
                    })
                        .then((response) => {
                            console.log(response.data);
                            router.replace('/login');
                        })
                        .catch((error) => {
                            console.error(error);
                        });
                }
            })
            .catch((error) => {
                console.error(error);
            });   
    };

    return (
        <div>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)} // Controlled input
                    />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} // Controlled input
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} // Controlled input
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} // Controlled input
                    />
                </div>
                <div>
                    <label htmlFor="role">Role</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)} // Controlled input
                    >
                        <option value="customer">Customer</option>
                        <option value="driver">Driver</option>
                    </select>
                </div>
                {(role == "driver") && (
                    <div>
                        <div>
                            <label htmlFor="license">License No</label>
                            <input
                                type="text"
                                id="license"
                                value={license}
                                onChange={(e) => setLicense(e.target.value)} // Controlled input
                            />
                        </div>
                        <div>
                            <label htmlFor="vehicle">Vehicle No</label>
                            <input
                                type="text"
                                id="vehicle"
                                value={vehicle}
                                onChange={(e) => setVehicle(e.target.value)} // Controlled input
                            />
                        </div>
                    </div>
                )}

                <button type="submit">Register</button>
            </form>
        </div>
    );
}
