"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://employees-dashboard-back-end-portfo.vercel.app/api/employees";

const requestTimeout = 10000;

const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeout);

  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err.name === "AbortError") {
        const error = new Error("Request timeout");
        error.name = "AbortError";
        throw error;
      }
      throw err;
    })
    .finally(() => {
      clearTimeout(timeout);
    });
};

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState("");

  const getErrorMessage = async (response) => {
    try {
      const data = await response.json();
      return data?.message || `Request failed (${response.status})`;
    } catch {
      return `Request failed (${response.status})`;
    }
  };

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    setError("");

    try {
      const response = await fetchWithTimeout(API_URL);
      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.employees)
        ? data.employees
        : [];

      setEmployees(list);
    } catch (err) {
      console.error("Load employees error:", err);
      setEmployees([]);
      
      if (err.name === "AbortError") {
        setError("Loading employees took too long. Make sure the API is running.");
      } else if (err instanceof TypeError) {
        setError("Unable to connect to the API. Check the internet connection and API URL.");
      } else {
        setError(err.message || "Unable to load employees. Please try again.");
      }
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const departments = [...new Set(
    employees.map((employee) => employee.department).filter(Boolean)
  )].sort();

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.trim().toLowerCase();
    const matchesSearch = !search || [
      employee.name,
      employee.email,
      employee.phone,
      employee.jobTitle,
    ].some((value) => value?.toLowerCase().includes(search));
    const matchesDepartment =
      !departmentFilter || employee.department === departmentFilter;
    const matchesStatus = !statusFilter || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("");
    setStatusFilter("");
  };

  const copyEmail = async (event, email) => {
    event.stopPropagation();

    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(""), 1500);
    } catch {
      setError("Unable to copy the email address.");
    }
  };

  return (
    <main className={styles.dashboard}>
      <h1>Staff Dashboard</h1>

      {error && <p className={styles.error}>{error}</p>}

      <section className={styles.filters} aria-label="Employee filters">
        <input
          type="search"
          placeholder="Search by name, email, or phone"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          value={departmentFilter}
          onChange={(event) => setDepartmentFilter(event.target.value)}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button type="button" onClick={clearFilters}>
          Clear filters
        </button>
      </section>

      <p className={styles.resultsCount}>
        Showing {filteredEmployees.length} of {employees.length} employees
      </p>

      <section className={styles.grid}>
        {isLoadingEmployees && <p>Loading employees...</p>}
        {!isLoadingEmployees && !error && filteredEmployees.length === 0 && (
          <p>{employees.length === 0 ? "There are no employees yet." : "No matching results were found."}</p>
        )}
        {filteredEmployees.map((employee) => (
          <article
            className={styles.card}
            key={employee._id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedEmployee(employee)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedEmployee(employee);
              }
            }}
          >
            {employee.imageUrl && (
              <img src={employee.imageUrl} alt={employee.name} />
            )}
            <div>
              <small>{employee.status === "active" ? "active" : "inactive"}</small>
              <h2>{employee.name}</h2>
              <p>{employee.jobTitle} - {employee.department}</p>
              <p>
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={(event) => copyEmail(event, employee.email)}
                  aria-label={`Copy email ${employee.email}`}
                >
                  {copiedEmail === employee.email ? "Copied" : employee.email}
                </button>
                {" - "}{employee.phone}
              </p>
            </div>
          </article>
        ))}
      </section>

      {selectedEmployee && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setSelectedEmployee(null)}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeModal}
              aria-label="Close details"
              onClick={() => setSelectedEmployee(null)}
            >
              ×
            </button>

            {selectedEmployee.imageUrl && (
              <img
                className={styles.modalImage}
                src={selectedEmployee.imageUrl}
                alt={selectedEmployee.name}
              />
            )}

            <h2 id="employee-details-title">{selectedEmployee.name}</h2>
            <dl className={styles.detailsList}>
              <div>
                <dt>email</dt>
                <dd>
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={(event) => copyEmail(event, selectedEmployee.email)}
                    aria-label={`Copy email ${selectedEmployee.email}`}
                  >
                    {copiedEmail === selectedEmployee.email ? "Copied" : selectedEmployee.email}
                  </button>
                </dd>
              </div>
              <div><dt>phone number</dt><dd>{selectedEmployee.phone}</dd></div>
              <div><dt>job title</dt><dd>{selectedEmployee.jobTitle}</dd></div>
              <div><dt>department</dt><dd>{selectedEmployee.department}</dd></div>
              <div><dt>birth date</dt><dd>{selectedEmployee.birthDate?.slice(0, 10)}</dd></div>
              <div><dt>status</dt><dd>{selectedEmployee.status === "active" ? "active" : "inactive"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </main>
  );
}


