export interface FormField {
    id: string;
    name: string;
    label: string;
    data_type: string;
    render_type: string;
    required: boolean;
    options?: Array<{ text: string; img: string }>;
    column_name?: string;
  }
  
  export interface FormConfig {
    fields: FormField[];
    title: string;
    apiEndpoint: string;
  }
  
  export const formConfig: FormConfig = {
    title: "Employee Information Form",
    apiEndpoint: "https://api.example.com/submit-form",
    fields: [
      {
        id: 'firstName',
        name: 'firstName',
        label: 'First Name',
        data_type: 'string',
        render_type: 'editable_text',
        required: true,
      },
      {
        id: 'lastName',
        name: 'lastName',
        label: 'Last Name',
        data_type: 'string',
        render_type: 'editable_text',
        required: true,
      },
      {
        id: 'age',
        name: 'age',
        label: 'Age',
        data_type: 'number',
        render_type: 'editable_num',
        required: false,
      },
      {
        id: 'role',
        name: 'role',
        label: 'Role',
        data_type: 'string',
        render_type: 'dropdown',
        required: true,
        options: [
          { text: 'Developer', img: 'https://w7.pngwing.com/pngs/738/965/png-transparent-web-development-web-design-software-development-web-developer-web-design-blue-angle-web-design.png' },
          { text: 'Tester', img: 'https://th.bing.com/th/id/OIP.93_uKN8dafXGigQ4aHCKxgHaHa?w=197&h=197&c=7&r=0&o=5&pid=1.7' },
          { text: 'Trainee', img: 'https://th.bing.com/th/id/OIP.pDv2m7MS80u0MThWb_cMsAHaHa?rs=1&pid=ImgDetMain' }
        ],
      },
      {
        id: 'active',
        name: 'active',
        label: 'Active Employee',
        data_type: 'boolean',
        render_type: 'switch',
        required: false,
      },
      {
        id: 'senior',
        name: 'senior',
        label: 'Senior Employee',
        data_type: 'boolean',
        render_type: 'switch',
        required: false,
      },
      {
        id: 'rating',
        name: 'rating',
        label: 'Employee Rating',
        data_type: 'number',
        render_type: 'rating',
        required: false,
      },
      {
        id: 'avatar',
        name: 'avatar',
        label: 'Avatar',
        data_type: 'React.ReactNode',
        render_type: 'element',
        required: false,
      },
      {
        id: 'progress',
        name: 'progress',
        label: 'Profile Progress',
        data_type: 'number',
        render_type: 'progress_bar',
        column_name: 'Profile Progress',
        required: false,
      },
    ],
  };