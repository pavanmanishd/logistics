export default function Register() {
    return (
        <div>
            <h1>Register</h1>
            <form>
                <div>
                    <label htmlFor="name">Name</label>
                    <input type="text" id="name" />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input type="password" id="confirmPassword" />
                </div>
                <div>
                    <label htmlFor="role">Role</label>
                    <select id="role">
                        <option value="user">User</option>
                        <option value="driver">Driver</option>
                    </select>
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}