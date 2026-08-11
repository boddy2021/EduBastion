import styles from './InputField.module.css';

const InputField = ({ label, type, placeholder, value, onChange }) => {
    return (
        <div className={styles.wrapper}>
            {label && <label className={styles.label}>{label}</label>}
            <input 
                className={styles.input}
                type={type || "text"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </div>
    );
};

export default InputField;