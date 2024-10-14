import ProtectedRoute from "@/validation/ProtectedRoute"

export default function Book() {
    return (
        <ProtectedRoute element={
            <div>
                <h1>Book</h1>
                <form>
                    <div>
                        <label htmlFor="Source">Source</label>
                        <input type="text" id="Source" />
                    </div>
                    <div>
                        <label htmlFor="Destination">Destination</label>
                        <input type="text" id="Destination" />
                    </div>
                    <div>
                        <p>Estimated Fare: $10</p>
                        <button type="submit">Book</button>
                    </div>
                </form>
            </div>
        } />
    );
}