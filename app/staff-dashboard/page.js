"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://employees-dashboard-back-end-portfo.vercel.app/api/employees";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  jobTitle: "",
  department: "",
  birthDate: getTodayDate(),
  status: "active",
  image: null,
};

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
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
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

  const handleChange = (event) => {
    const value =
      event.target.name === "image"
        ? event.target.files?.[0] || null
        : event.target.value;

    setForm({
      ...form,
      [event.target.name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.birthDate) {
      setError("Birth date is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetchWithTimeout(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? "PUT" : "POST",
          body: (() => {
            const formData = new FormData();
            Object.entries(form).forEach(([key, value]) => {
              if (key !== "image" && value !== "") {
                formData.append(key, value);
              }
            });
            if (form.image) {
              formData.append("image", form.image);
            }
            return formData;
          })(),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadEmployees();
    } catch (err) {
      console.error("Submit error:", err);
      if (err.name === "AbortError") {
        setError("The request timed out. Please try again.");
      } else if (err instanceof TypeError) {
        setError("Unable to connect to the API. Check the internet connection.");
      } else {
        setError(err.message || "Unable to save the employee. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const editEmployee = (employee) => {
    setForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      jobTitle: employee.jobTitle || "",
      department: employee.department || "",
      birthDate: employee.birthDate ? employee.birthDate.slice(0, 10) : "",
      status: employee.status || "active",
      image: null,
    });
    setEditingId(employee._id);
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Do you want to delete this employee?")) return;

    setDeletingId(id);
    setError("");

    try {
      const response = await fetchWithTimeout(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      await loadEmployees();
    } catch (err) {
      console.error("Delete error:", err);
      if (err.name === "AbortError") {
        setError("The request timed out. Please try again.");
      } else if (err instanceof TypeError) {
        setError("Unable to connect to the API. Check the internet connection.");
      } else {
        setError(err.message || "Unable to delete the employee. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

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
      employee.birthDate,
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
    await navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(""), 1500);
  };

  return (
    <main className={styles.dashboard}>
      <h1>Employees Dashboard</h1>

      {error && <p className={styles.error}>{error}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Employee name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={handleChange}
          required
        />

        <input
          name="jobTitle"
          placeholder="Job title"
          value={form.jobTitle}
          onChange={handleChange}
          required
        />

        <input
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          required
        />

        <input
          name="birthDate"
          type="date"
          placeholder="Birth date"
          aria-label="Birth date"
          value={form.birthDate}
          onChange={handleChange}
          required
        />

        <select name="status" value={form.status} onChange={handleChange}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <input
          name="image"
          type="file"
          accept="image/*"
          aria-label="Employee image"
          onChange={handleChange}
        />

        <button disabled={loading || deletingId !== null}>
          {editingId ? "Save employee changes" : "Add employee"}
        </button>

        {editingId && (
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
            }}
          >
            Cancel
          </button>
        )}
      </form>

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
              <small>{employee.status === "active" ? "Active" : "Inactive"}</small>
              <h2>{employee.name}</h2>
              <p>{employee.jobTitle} - {employee.department}</p>
              <p>
                <button
                  type="button"
                  className={styles.emailButton}
                  onClick={(event) => copyEmail(event, employee.email)}
                  aria-label={`Copy email ${employee.email}`}
                >
                  {copiedEmail === employee.email ? "Copied" : employee.email}
                </button>
              </p>
              <p>{employee.phone}</p>
              <button
                disabled={loading || deletingId !== null}
                onClick={(event) => {
                  event.stopPropagation();
                  editEmployee(employee);
                }}
              >
                Edit
              </button>
              <button
                className={styles.delete}
                disabled={loading || deletingId !== null}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteEmployee(employee._id);
                }}
              >
                {deletingId === employee._id ? "Deleting..." : "Delete"}
              </button>
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
                <dt>Email</dt>
                <dd>
                  <button
                    type="button"
                    className={styles.emailButton}
                    onClick={(event) => copyEmail(event, selectedEmployee.email)}
                    aria-label={`Copy email ${selectedEmployee.email}`}
                  >
                    {copiedEmail === selectedEmployee.email ? "Copied" : selectedEmployee.email}
                  </button>
                </dd>
              </div>
              <div><dt>Phone number</dt><dd>{selectedEmployee.phone}</dd></div>
              <div><dt>Job title</dt><dd>{selectedEmployee.jobTitle}</dd></div>
              <div><dt>Department</dt><dd>{selectedEmployee.department}</dd></div>
              <div><dt>Birth date</dt><dd>{selectedEmployee.birthDate?.slice(0, 10)}</dd></div>
              <div><dt>Status</dt><dd>{selectedEmployee.status === "active" ? "Active" : "Inactive"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </main>
  );
}


