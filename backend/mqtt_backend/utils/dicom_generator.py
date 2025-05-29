import pydicom
from pydicom.dataset import Dataset, FileDataset
import datetime
import tempfile
import base64
import os

def create_dicom(fields, pixel_array=None, save_to=None):
    """
    Dynamically create a DICOM object and save it to disk (or return binary).
    - fields: dict of DICOM tags (e.g. {'PatientName': 'DOE^JOHN', 'PatientID': '123456'})
    - pixel_array: numpy ndarray (optional) for image data
    - save_to: path to save DICOM file (if None, use temp file)
    Returns: path to file and binary DICOM data
    """
    # Minimal meta info
    file_meta = pydicom.dataset.FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = pydicom.uid.generate_uid()
    file_meta.MediaStorageSOPInstanceUID = pydicom.uid.generate_uid()
    file_meta.ImplementationClassUID = pydicom.uid.generate_uid()

    # Create the FileDataset instance (initially no data elements, but file_meta supplied)
    dt = datetime.datetime.now()
    ds = FileDataset(save_to or tempfile.NamedTemporaryFile(delete=False).name,
                     {}, file_meta=file_meta, preamble=b"\0" * 128)

    # Required DICOM fields
    ds.PatientName = fields.get('PatientName', 'Anon^Anonymous')
    ds.PatientID = fields.get('PatientID', '000000')
    ds.StudyInstanceUID = fields.get('StudyInstanceUID', pydicom.uid.generate_uid())
    ds.SeriesInstanceUID = fields.get('SeriesInstanceUID', pydicom.uid.generate_uid())
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.Modality = fields.get('Modality', 'OT')
    ds.StudyDate = dt.strftime('%Y%m%d')
    ds.StudyTime = dt.strftime('%H%M%S')
    # You can add more fields as needed:
    for key, value in fields.items():
        setattr(ds, key, value)
    # Optionally, add pixel data (for image modalities)
    if pixel_array is not None:
        ds.Rows, ds.Columns = pixel_array.shape[:2]
        ds.PhotometricInterpretation = "MONOCHROME2"
        ds.SamplesPerPixel = 1
        ds.BitsStored = 8
        ds.BitsAllocated = 8
        ds.HighBit = 7
        ds.PixelRepresentation = 0
        ds.PixelData = pixel_array.tobytes()

    ds.is_little_endian = True
    ds.is_implicit_VR = True

    if save_to is None:
        temp_path = ds.filename
    else:
        temp_path = save_to

    ds.save_as(temp_path)
    with open(temp_path, 'rb') as f:
        dicom_bytes = f.read()
    # Optionally delete temp file if not user-specified
    if save_to is None:
        os.remove(temp_path)
    return dicom_bytes  # Return binary DICOM

def dicom_bytes_to_base64(dicom_bytes):
    return base64.b64encode(dicom_bytes).decode()
